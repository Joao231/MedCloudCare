import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withDialog } from '@ohif/ui';
import ConnectedViewerMain from './ConnectedViewerMain.js';
import ErrorBoundaryDialog from './../components/ErrorBoundaryDialog';
import './Viewer.css';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
const larvitar = require('D:/tese/Bia_final/frontend_bia/node_modules/larvitar/index.js');

class ViewerNrrd extends Component {
  static propTypes = {
    studies: PropTypes.array,
    // window.store.getState().viewports.viewportSpecificData
    // window.store.getState().viewports.activeViewportIndex
    isStudyLoaded: PropTypes.bool,
    nrrdFile: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {
      scale: null,
      stackSize: null,
      element: null,
      imageDimensions: null,
      slice: null,
    };
  }

  logMouseButton = e => {
    if (typeof e === 'object') {
      let viewport = cornerstone.getViewport(this.state.element);

      let image = cornerstone.getImage(this.state.element);

      const imageDimensions = `${image.width} x ${image.height}`;

      let windowWidth = viewport.voi.windowWidth;
      let windowCenter = viewport.voi.windowCenter;

      const wwwc = `W: ${
        windowWidth.toFixed ? windowWidth.toFixed(0) : windowWidth
      } L: ${windowWidth.toFixed ? windowCenter.toFixed(0) : windowCenter}`;

      const stackState = cornerstoneTools.getToolState(
        this.state.element,
        'stack'
      );
      const stackData = stackState.data[0];

      this.setState({
        scale: viewport.scale,
        wwwc: wwwc,
        size: imageDimensions,
        slice: stackData.currentImageIdIndex + 1,
        stackSize: stackData.imageIds.length,
      });
    }
  };

  logScrollButton = () => {
    const stackState = cornerstoneTools.getToolState(
      this.state.element,
      'stack'
    );
    const stackData = stackState.data[0];

    this.setState({
      slice: stackData.currentImageIdIndex + 1,
      stackSize: stackData.imageIds.length,
    });
  };

  componentDidMount() {
    if (this.props.nrrdFile) {
      let oneFile = this.props.nrrdFile;
      let reader = new FileReader();
      reader.readAsArrayBuffer(oneFile);

      let elementos = document.getElementsByClassName('ViewerMain');

      let element = elementos[0];

      element.innerText = '';

      cornerstone.enable(element);

      this.setState({ element: element });
      element.addEventListener('mouseup', this.logMouseButton);
      element.addEventListener('wheel', this.logScrollButton);

      const scope = this;

      reader.onload = function() {
        let volume = larvitar.importNRRDImage(reader.result);

        let serie = larvitar.buildNrrdImage(volume, '1234', {});

        scope.renderImage(serie, element);
      };
    }
  }

  getSeriesData(series) {
    let data = {};
    if (series.isMultiframe) {
      data.isMultiframe = true;
      data.numberOfSlices = series.imageIds.length;
      data.imageIndex = 0;
      data.imageId = series.imageIds[data.imageIndex];
    } else {
      data.isMultiframe = false;
      data.numberOfSlices = series.imageIds.length;

      data.imageIndex = Math.floor(data.numberOfSlices / 2);

      data.imageId = series.imageIds[data.imageIndex];
    }
    data.isColor = series.color;
    data.isTimeserie = false; // TODO 4D

    // rows, cols and x y z spacing
    data.rows = series.instances[series.imageIds[0]].metadata['x00280010'];
    data.cols = series.instances[series.imageIds[0]].metadata['x00280011'];
    data.thickness = series.instances[series.imageIds[0]].metadata['x00180050'];
    data.spacing_x = series.instances[series.imageIds[0]].metadata['x00280030']
      ? series.instances[series.imageIds[0]].metadata['x00280030'][0]
      : null;
    data.spacing_y = series.instances[series.imageIds[0]].metadata['x00280030']
      ? series.instances[series.imageIds[0]].metadata['x00280030'][1]
      : null;

    // window center and window width
    data.wc = series.instances[series.imageIds[0]].metadata['x00281050'];

    data.ww = series.instances[series.imageIds[0]].metadata['x00281051'];

    // default values for reset
    data.defaultWW = data.ww;
    data.defaultWC = data.wc;

    if (data.rows == null || data.cols == null) {
      alert('invalid image metadata');

      return;
    }
    return data;
  }

  updateData(element) {
    let elementEnabled = cornerstone.getEnabledElement(element);
    let image = elementEnabled.image;

    let viewport = cornerstone.getViewport(element);
    let imageDimensions = `${image.width} x ${image.height}`;
    let wwwc = `W: ${
      image.windowWidth.toFixed
        ? image.windowWidth.toFixed(0)
        : image.windowWidth
    } L: ${
      image.windowWidth.toFixed
        ? image.windowCenter.toFixed(0)
        : image.windowCenter
    }`;

    this.setState({
      scale: viewport.scale,
      wwwc: wwwc,
      imageDimensions: imageDimensions,
    });
  }

  renderImage(seriesStack, element) {
    let series = { ...seriesStack };
    let data;

    data = this.getSeriesData(series);
    if (!data.imageId) {
      alert('Error during renderImage: imageId has not been loaded yet.');
      return;
    }

    // Add stack tool, and set it's mode
    const StackScrollTool = cornerstoneTools.StackScrollTool;

    //define the stack
    const stack = {
      currentImageIdIndex: 0,
      imageIds: series.imageIds,
    };

    this.setState({ slice: 1, stackSize: series.imageIds.length });

    const scope = this;

    cornerstone.loadImage(data.imageId).then(function(image) {
      cornerstone.displayImage(element, image);
      scope.updateData(element);
      cornerstoneTools.addStackStateManager(element, ['stack']);
      cornerstoneTools.addToolState(element, 'stack', stack);
      cornerstoneTools.addTool(StackScrollTool);

      let colormap = cornerstone.colors.getColormap('gray');
      let viewport = cornerstone.getViewport(element);

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
  }

  render() {
    const zoomPercentage = parseFloat(this.state.scale * 100).toFixed(0);
    return (
      <>
        <div style={{ marginLeft: '20px' }}>
          {' '}
          <p
            style={{
              float: 'left',
            }}
          >
            <p
              style={{
                marginBottom: '10px',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-mouse2-fill"
                viewBox="0 0 16 16"
              >
                <path d="M7.5.026C4.958.286 3 2.515 3 5.188V5.5h4.5V.026zm1 0V5.5H13v-.312C13 2.515 11.042.286 8.5.026zM13 6.5H3v4.313C3 13.658 5.22 16 8 16s5-2.342 5-5.188V6.5z" />
              </svg>{' '}
              <b>Commands</b>{' '}
            </p>
            Left Mouse Button: <b>WW/WC</b>; Right Mouse Button: <b>Zoom</b>;{' '}
            <br></br>
            Mouse Scroll: <b>Change Slice</b>; Press Scroll Button: <b>Pan</b>.
          </p>
          {cornerstone.getEnabledElements().length > 0 ? (
            <p
              style={{
                marginRight: '30px',
                float: 'right',
              }}
            >
              <b>Zoom</b>: {zoomPercentage} %<br></br>
              <b>Window Width/Level</b>: {this.state.wwwc}
              <br></br>
              <b>Image Dimensions</b>: {this.state.imageDimensions}
              <br></br>
              <b>Slice Number</b>: {this.state.slice}/{this.state.stackSize}
              <br></br>
            </p>
          ) : null}
        </div>
        {/* VIEWPORTS */}
        <div className="FlexboxLayout">
          {/* MAIN */}
          <div className={classNames('main-content')}>
            <ErrorBoundaryDialog context="ViewerMain">
              <ConnectedViewerMain
                studies={this.props.studies}
                isStudyLoaded={this.props.isStudyLoaded}
              />
            </ErrorBoundaryDialog>
          </div>
        </div>
      </>
    );
  }
}

export default withDialog(ViewerNrrd);
