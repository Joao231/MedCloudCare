/* eslint-disable jsx-a11y/anchor-has-content */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './Panel.styl';
import SegmentationList from './SegmentationList';
import Client from '../services/Client';
import { UINotificationService } from '@ohif/core';
import { getImageIdsForDisplaySet } from '../utils/SegmentationUtils';
import cornerstone from 'cornerstone-core';
import MD5 from 'md5.js';
import Inference from './actions/Inference';
import axiosInstance from 'axios';
import { connect } from 'react-redux';
import NrrdResult from './NrrdResult.js';
import cornerstoneTools from 'cornerstone-tools';

class Panel extends Component {
  static propTypes = {
    studies: PropTypes.any,
    viewports: PropTypes.any,
    activeIndex: PropTypes.any,
    user: PropTypes.object,
  };

  constructor(props) {
    super(props);

    const { viewports, studies, activeIndex } = props;

    this.viewConstants = this.getViewConstants(viewports, studies, activeIndex);

    const { element } = this.viewConstants;
    const mainImage = cornerstone.getEnabledElement(element).image;

    this.notification = UINotificationService.create({});
    this.segmentationList = React.createRef();
    this.nrrdImageList = React.createRef();
    this.actions = {
      inference: React.createRef(),
    };

    this.state = {
      children: null,
      results: null,
      info: [],
      action: {},
      isResultsButtonDisabled: true,
      mainImage: mainImage,
      renderNrrd: false,
      filterBodyPart: '',
    };
  }

  async componentDidMount() {
    this.setState({ info: await this.onInfo() });
    this.setState({
      children: (
        <div>
          <Inference
            ref={this.actions['inference']}
            tabIndex={3}
            info={this.state.info}
            viewConstants={this.viewConstants}
            client={this.client}
            notification={this.notification}
            updateView={this.updateView}
            onSelectActionTab={this.onSelectActionTab}
            onOptionsConfig={this.onOptionsConfig}
            handleFilterChange={this.handleFilterChange}
            onClickApply={this.onClickApply}
          />
        </div>
      ),
    });
  }

  client = () => {
    return new Client();
  };

  getViewConstants = (viewports, studies, activeIndex) => {
    const viewport = viewports[activeIndex];

    const { PatientID } = studies[activeIndex];

    const {
      StudyInstanceUID,
      SeriesInstanceUID,
      displaySetInstanceUID,
    } = viewport;

    const imageIds = getImageIdsForDisplaySet(
      studies,
      StudyInstanceUID,
      SeriesInstanceUID
    );
    const imageIdsToIndex = new Map();
    for (let i = 0; i < imageIds.length; i++) {
      imageIdsToIndex.set(imageIds[i], i);
    }

    const element = cornerstone.getEnabledElements()[this.props.activeIndex]
      .element;
    const cookiePostfix = new MD5()
      .update(PatientID + StudyInstanceUID + SeriesInstanceUID)
      .digest('hex');

    return {
      PatientID: PatientID,
      StudyInstanceUID: StudyInstanceUID,
      SeriesInstanceUID: SeriesInstanceUID,
      displaySetInstanceUID: displaySetInstanceUID,
      imageIdsToIndex: imageIdsToIndex,
      element: element,
      numberOfFrames: imageIds.length,
      cookiePostfix: cookiePostfix,
      viewports: viewports,
    };
  };

  handleFilterChange = value => {
    this.setState({
      filterBodyPart: value,
    });
  };

  onClickApply = async () => {
    this.setState({ info: await this.onInfo() });
    this.setState({
      children: (
        <div>
          <Inference
            ref={this.actions['inference']}
            tabIndex={3}
            info={this.state.info}
            viewConstants={this.viewConstants}
            client={this.client}
            notification={this.notification}
            updateView={this.updateView}
            onSelectActionTab={this.onSelectActionTab}
            onOptionsConfig={this.onOptionsConfig}
            handleFilterChange={this.handleFilterChange}
            onClickApply={this.onClickApply}
          />
        </div>
      ),
    });
  };

  onInfo = async () => {
    let url = `/api/model/?user=${this.props.user.email}`;
    let filterBodyPart = this.state.filterBodyPart;

    if (
      filterBodyPart !== null &&
      filterBodyPart !== '' &&
      filterBodyPart !== undefined
    ) {
      let param = filterBodyPart;

      url = url + `&bodyPart=${param}`;
    }

    const response = await axiosInstance
      .get(url, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `JWT ${localStorage.getItem('access')}`,
        },
      })
      .then(res => {
        return res;
      })
      .catch(error => {
        return error.response;
      });

    if (response.status !== 200) {
      this.notification.show({
        title: 'AI Tools',
        message: 'Failed to Connect to Server',
        type: 'error',
        duration: 6000,
      });
    } else {
      return response.data;
    }
  };

  disableResults = () => {
    this.setState({ isResultsButtonDisabled: true });
    this.onModelsClick();
  };

  csToolsUpdateImageIds = (element, imageIds, imageIdIndex) => {
    const stackState = cornerstoneTools.getToolState(element, 'stack');
    const stackData = stackState.data[0];
    stackData.imageIds = imageIds;

    stackData.currentImageIdIndex =
      stackData.currentImageIdIndex < imageIdIndex
        ? stackData.currentImageIdIndex
        : (stackData.currentImageIdIndex += 1);
  };

  updateTheImage = () => {
    const data = this.state.mainImage;

    const element = this.viewConstants.element;

    cornerstone.loadImage(data.imageId).then(function(image) {
      cornerstone.displayImage(element, image);

      let viewport = cornerstone.getViewport(element);
      let colormap = cornerstone.colors.getColormap('gray');

      element.style.width = image.width;
      element.style.height = image.height;
      cornerstone.resize(element, true);

      viewport.voi.windowWidth = image.windowWidth;
      viewport.voi.windowCenter = image.windowCenter;
      viewport.invert = image.invert;
      viewport.colormap = colormap;
      cornerstone.setViewport(element, viewport);

      cornerstone.fitToWindow(element);
    });

    cornerstone.updateImage(element);
  };

  resetImage = () => {
    if (this.state.renderNrrd) {
      const { element, imageIdsToIndex } = this.viewConstants;
      this.updateTheImage();

      this.csToolsUpdateImageIds(
        element,
        Array.from(imageIdsToIndex.keys()),
        0
      );
    }
  };

  onModelsClick = async () => {
    this.resetImage();

    this.setState({
      children: (
        <div>
          <Inference
            ref={this.actions['inference']}
            tabIndex={3}
            info={this.state.info}
            viewConstants={this.viewConstants}
            client={this.client}
            notification={this.notification}
            updateView={this.updateView}
            onSelectActionTab={this.onSelectActionTab}
            onOptionsConfig={this.onOptionsConfig}
            handleFilterChange={this.handleFilterChange}
            onClickApply={this.onClickApply}
          />
        </div>
      ),
    });
  };

  onResultsClick = () => {
    let results = this.state.results;
    this.setState({
      children: results,
    });
  };

  onSegmentCreated = id => {
    for (const action of Object.keys(this.actions)) {
      if (this.actions[action].current)
        this.actions[action].current.onSegmentCreated(id);
    }
  };
  onSegmentUpdated = id => {
    for (const action of Object.keys(this.actions)) {
      if (this.actions[action].current)
        this.actions[action].current.onSegmentUpdated(id);
    }
  };
  onSegmentDeleted = id => {
    for (const action of Object.keys(this.actions)) {
      if (this.actions[action].current)
        this.actions[action].current.onSegmentDeleted(id);
    }
  };
  onSegmentSelected = id => {
    for (const action of Object.keys(this.actions)) {
      if (this.actions[action].current)
        this.actions[action].current.onSegmentSelected(id);
    }
  };

  onSelectActionTab = name => {
    // Leave Event
    for (const action of Object.keys(this.actions)) {
      if (this.state.action === action) {
        if (this.actions[action].current)
          this.actions[action].current.onLeaveActionTab();
      }
    }

    // Enter Event
    for (const action of Object.keys(this.actions)) {
      if (name === action) {
        if (this.actions[action].current)
          this.actions[action].current.onEnterActionTab();
      }
    }

    this.setState({ action: name });
  };

  onOptionsConfig = () => {
    return this.actions['options'].current &&
      this.actions['options'].current.state
      ? this.actions['options'].current.state.config
      : {};
  };

  updateView = async (response, labels, task, operation, slice, overlap) => {
    if (task === 'Classification') {
      let result = response.data['prediction'];
      if (typeof result !== 'object') {
        this.notification.show({
          title: 'AI Tools',
          message: 'Prediction result is not a JSON object!',
          type: 'error',
          duration: 6000,
        });
      } else {
        const elements = [];
        Object.keys(result).forEach(label => {
          elements.push(label);
        });
        this.setState({
          children: (
            <div>
              <h4 style={{ marginLeft: '10px' }}>Prediction Result</h4>
              <br></br>
              <ul>
                {elements.map((value, index) => {
                  return (
                    <li key={index}>
                      {value}: {result[value]}
                    </li>
                  );
                })}
              </ul>
            </div>
          ),
          isResultsButtonDisabled: false,
          renderNrrd: false,
          results: (
            <div>
              <h4 style={{ marginLeft: '10px' }}>Prediction Result</h4>
              <br></br>
              <ul>
                {elements.map((value, index) => {
                  return (
                    <li key={index}>
                      {value}: {result[value]}
                    </li>
                  );
                })}
              </ul>
            </div>
          ),
        });
      }
    } else if (task === 'Segmentation') {
      this.setState({
        children: (
          <div>
            <SegmentationList
              ref={this.segmentationList}
              viewConstants={this.viewConstants}
              onSegmentCreated={this.onSegmentCreated}
              onSegmentUpdated={this.onSegmentUpdated}
              onSegmentDeleted={this.onSegmentDeleted}
              onSegmentSelected={this.onSegmentSelected}
              client={this.client}
            />
          </div>
        ),
        isResultsButtonDisabled: false,
        renderNrrd: false,
        results: (
          <div>
            <SegmentationList
              ref={this.segmentationList}
              viewConstants={this.viewConstants}
              onSegmentCreated={this.onSegmentCreated}
              onSegmentUpdated={this.onSegmentUpdated}
              onSegmentDeleted={this.onSegmentDeleted}
              onSegmentSelected={this.onSegmentSelected}
              client={this.client}
            />
          </div>
        ),
      });
      this.segmentationList.current.updateView(
        response,
        labels,
        operation,
        slice,
        overlap
      );
    } else {
      this.setState({
        children: (
          <div>
            <NrrdResult
              ref={this.nrrdImageList}
              viewConstants={this.viewConstants}
              client={this.client}
              disableResultsButton={this.disableResults}
              resetImage={this.resetImage}
            />
          </div>
        ),
        isResultsButtonDisabled: false,
        renderNrrd: true,
        results: (
          <div>
            <NrrdResult
              ref={this.nrrdImageList}
              viewConstants={this.viewConstants}
              client={this.client}
              disableResultsButton={this.disableResults}
              resetImage={this.resetImage}
            />
          </div>
        ),
      });
      this.nrrdImageList.current.updateView(response, labels);
    }
  };

  render() {
    let children = this.state.children;
    return (
      <div className="monaiLabelPanel">
        <div
          className="btn-group rounded-pill"
          role="group"
          aria-label="Outline example"
          style={{
            width: '100%',
            borderRadius: '5px',
            marginBottom: '5px',
            marginTop: '10px',
          }}
        >
          <button
            type="button"
            onClick={this.onModelsClick}
            className="btn btn-outline-primary"
          >
            Models
          </button>
          <button
            type="button"
            onClick={this.onResultsClick}
            className="btn btn-outline-primary"
            disabled={this.state.isResultsButtonDisabled}
          >
            Results
          </button>
        </div>
        <hr></hr>
        {children}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  user: state.auth.user,
});

const ConnectedPanel = connect(
  mapStateToProps,
  null
)(Panel);

export default ConnectedPanel;
