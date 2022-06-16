/* eslint-disable react/no-unescaped-entities */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import {
  UIModalService,
  UINotificationService,
  UIDialogService,
} from '@ohif/core';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import './SegmentationList.styl';
import SegmentationReader from '../utils/SegmentationReader';

const larvitar = require('D:/tese/Bia_final/frontend_bia/node_modules/larvitar/index.js');

export default class NrrdResult extends Component {
  static propTypes = {
    viewConstants: PropTypes.any,
    client: PropTypes.func,
    disableResultsButton: PropTypes.func,
    resetImage: PropTypes.func,
    canEditStudy: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.notification = UINotificationService.create({});
    this.uiModelService = UIModalService.create({});
    this.uiDialogService = UIDialogService.create({});

    const { element } = this.props.viewConstants;

    const mainImage = cornerstone.getEnabledElement(element).image;

    this.state = {
      element: element,
      results: null,
      selectedResultId: null,
      header: null,
      image: null,
      mainImage: mainImage,
      resultImage: null,
      nrrdSeries: null,
      scale: null,
      wwwc: null,
      size: null,
      slice: null,
      stackSize: null,
      activeColorMap: null,
    };

    this.state.element.addEventListener('mouseup', this.logMouseButton);
    this.state.element.addEventListener('wheel', this.logScrollButton);
    document.addEventListener('keypress', this.logKeyButton);
    this.color_counter = 0;
  }

  componentWillUnmount() {
    this.state.element.removeEventListener('mouseup', this.logMouseButton);
    this.state.element.removeEventListener('wheel', this.logScrollButton);
    document.removeEventListener('keypress', this.logKeyButton);
  }

  logMouseButton = e => {
    if (typeof e === 'object') {
      if (e.button === 0) {
        let viewport = cornerstone.getViewport(
          this.props.viewConstants.element
        );

        let image = cornerstone.getImage(this.props.viewConstants.element);

        const imageDimensions = `${image.width} x ${image.height}`;

        let windowWidth = viewport.voi.windowWidth;
        let windowCenter = viewport.voi.windowCenter;

        const wwwc = `W: ${
          windowWidth.toFixed ? windowWidth.toFixed(0) : windowWidth
        } L: ${windowWidth.toFixed ? windowCenter.toFixed(0) : windowCenter}`;

        const stackState = cornerstoneTools.getToolState(
          this.props.viewConstants.element,
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
    }
  };

  logScrollButton = () => {
    const stackState = cornerstoneTools.getToolState(
      this.props.viewConstants.element,
      'stack'
    );
    const stackData = stackState.data[0];

    this.setState({
      slice: stackData.currentImageIdIndex + 1,
      stackSize: stackData.imageIds.length,
    });
  };

  logKeyButton = e => {
    e = e || window.event;
    let color_maps = larvitar.getColormapsList();
    this.color_counter =
      this.color_counter === color_maps.length - 1 ? 0 : this.color_counter + 1;
    let color_map = color_maps[this.color_counter];

    if (e.keyCode === 109) {
      let colormap = cornerstone.colors.getColormap(color_map.id);

      const viewport = cornerstone.getViewport(
        this.props.viewConstants.element
      );
      if (viewport) {
        viewport.colormap = colormap;
        cornerstone.setViewport(this.props.viewConstants.element, viewport);
        cornerstone.updateImage(this.props.viewConstants.element, true);
      }

      this.setState({ activeColorMap: color_map.name });
    }
  };

  onSelect = evt => {
    let checked = evt.currentTarget.checked;

    if (!checked) {
      if (this.props.resetImage) {
        this.props.resetImage();
      }

      this.setState({ selectedResultId: null, activeColorMap: 'Gray' });
    } else {
      const { element } = this.props.viewConstants;

      this.updateTheImage(this.state.resultImage);

      this.csToolsUpdateImageIds(element, this.state.nrrdSeries.imageIds, 0);

      let id = this.state.results[0].id;

      this.setState({
        selectedResultId: id,
        slice: 1,
        stackSize: this.state.nrrdSeries.imageIds.length,
      });
    }
  };

  onClickDelete = () => {
    this.refreshTable();

    if (this.props.disableResultsButton) {
      this.props.disableResultsButton();
    }
  };

  onClickExport = () => {
    this.notification.show({
      title: 'AI Tools',
      message: 'Preparing the result to download as .nrrd',
      type: 'info',
      duration: 5000,
    });

    SegmentationReader.serializeNrrd(
      this.state.header,
      this.state.image,
      'result' + '.nrrd'
    );
  };

  refreshTable = result => {
    if (result) {
      let resultImage = [];
      resultImage.push(result);
      this.setState({ results: resultImage, selectedResultId: result.id });
    } else {
      this.setState({
        results: null,
        selectedResultId: null,
        header: null,
        image: null,
        resultImage: null,
        nrrdSeries: null,
        scale: null,
        wwwc: null,
        size: null,
        slice: null,
        stackSize: null,
      });
    }
  };

  updateView = async (response, labels) => {
    const element = this.props.viewConstants.element;

    const { header, image } = SegmentationReader.parseNrrdData(response.data);
    SegmentationReader.serializeNrrd(header, image, 'result' + '.nrrd');
    this.setState({ header: header, image: image });
    if (labels) {
      for (let label in labels) {
        if (Array.isArray(labels)) {
          label = labels[label] + '#1';

          if (this.state.results !== null && this.state.results.length > 0) {
            this.state.results.forEach(function(result) {
              if (result.label === label) {
                let index = parseInt(result.label.split('#')[1]);
                label = label.replace(`#${index}`, `#${index + 1}`);
              }
            });
          }
        }

        if (this.state.selectedResultId !== null) {
          let result = {
            color: 'Gray',
            id: this.state.selectedResultId + 1,
            label: label,
          };
          this.refreshTable(result);
        } else {
          let result = { color: 'Gray', id: 0, label: label };
          this.refreshTable(result);
        }
      }
    }

    let data = await response.data;
    let file = new File([data], 'example.nrrd');

    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    const scope = this;

    reader.onload = function() {
      let volume = larvitar.importNRRDImage(reader.result);

      let serie = larvitar.buildNrrdImage(volume, '1234', {});

      scope.renderImage(serie, element);

      scope.setState({
        nrrdSeries: serie,
      });
    };
  };

  getSeriesData = series => {
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

  updateTheImage = data => {
    const element = this.state.element;

    this.setState({ activeColorMap: 'Gray' });

    let scope = this;

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

      const imageDimensions = `${image.width} x ${image.height}`;

      let windowWidth = viewport.voi.windowWidth;
      let windowCenter = viewport.voi.windowCenter;

      const wwwc = `W: ${
        windowWidth.toFixed ? windowWidth.toFixed(0) : windowWidth
      } L: ${windowWidth.toFixed ? windowCenter.toFixed(0) : windowCenter}`;

      scope.setState({
        scale: viewport.scale,
        wwwc: wwwc,
        size: imageDimensions,
      });
    });
  };

  renderImage = (seriesStack, element) => {
    let series = { ...seriesStack };
    let data;

    data = this.getSeriesData(series);
    if (!data.imageId) {
      alert('Error during renderImage: imageId has not been loaded yet.');
      return;
    }

    this.setState({
      resultImage: data,
      slice: 1,
      stackSize: series.imageIds.length,
    });

    this.updateTheImage(data);

    this.csToolsUpdateImageIds(element, series.imageIds, data.imageIndex - 1);
  };

  render() {
    const resultId = this.state.selectedResultId;

    const zoomPercentage = parseFloat(this.state.scale * 100).toFixed(0);

    return (
      <div className="segmentationList">
        <table>
          <tbody>
            <tr>
              <td>
                <button
                  className="segButton"
                  onClick={this.onClickDelete}
                  title="Clear Result Image"
                  disabled={resultId === null}
                >
                  <Icon name="trash" width="12px" height="12px" />
                </button>
              </td>

              <td align="right">
                <button
                  className="segButton"
                  onClick={this.onClickExport}
                  title={'Download Result Image as .nrrd'}
                  disabled={resultId === null}
                >
                  <Icon name="save" width="12px" height="12px" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="segSection">
          <table className="segTable">
            <thead>
              <tr>
                <th width="2%">#</th>
                <th width="80%">Name</th>
              </tr>
            </thead>
            <tbody>
              {this.state.results !== null &&
                this.state.results.map(result => (
                  <tr key={result.id}>
                    <td>
                      <input
                        className="selectSegment"
                        name="selectSegment"
                        id="selectSegment"
                        type="checkbox"
                        checked={result.id === resultId}
                        onChange={e => {
                          this.onSelect(e);
                        }}
                      />
                    </td>

                    <td
                      className="segEdit"
                      contentEditable="true"
                      suppressContentEditableWarning="true"
                    >
                      {result.label}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {this.state.selectedResultId !== null &&
        this.state.nrrdSeries !== null ? (
          <p
            style={{
              marginTop: '10px',
              marginLeft: '10px',
            }}
          >
            <b>Zoom</b>: {zoomPercentage} %<br></br>
            <b>Window Width/Level</b>: {this.state.wwwc}
            <br></br>
            <b>Image Dimensions</b>: {this.state.size}
            <br></br>
            <b>Slice Number</b>: {this.state.slice}/{this.state.stackSize}
            <br></br>
          </p>
        ) : null}
        <p
          style={{
            marginTop: '10px',
            marginLeft: '10px',
          }}
        >
          <b>Active Color Map</b>: {this.state.activeColorMap}
          <br></br>
          Press <b>"M"</b> to cycle through color maps
        </p>
      </div>
    );
  }
}
