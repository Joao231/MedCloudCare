/* eslint-disable no-console */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Icon, SimpleDialog } from '@ohif/ui';
import {
  UIModalService,
  UINotificationService,
  UIDialogService,
} from '@ohif/core';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import './SegmentationList.styl';

import {
  createSegment,
  deleteSegment,
  flattenLabelmaps,
  getFirstSegmentId,
  getLabelMaps,
  getSegmentInfo,
  updateSegment,
  updateSegmentMeta,
} from '../utils/SegmentationUtils';
import SegmentationLabelForm from './SegmentationLabelForm';
import {
  hexToRgb,
  randomName,
  randomRGB,
  rgbToHex,
  getLabelColor,
} from '../utils/GenericUtils';
import SegmentationReader from '../utils/SegmentationReader';

const ColoredCircle = ({ color }) => {
  return (
    <span
      className="segColor"
      style={{ backgroundColor: `rgba(${color.join(',')})` }}
    />
  );
};

ColoredCircle.propTypes = {
  color: PropTypes.array.isRequired,
};

export default class SegmentationList extends Component {
  static propTypes = {
    viewConstants: PropTypes.any,
    onSegmentCreated: PropTypes.func,
    onSegmentUpdated: PropTypes.func,
    onSegmentDeleted: PropTypes.func,
    onSegmentSelected: PropTypes.func,
    client: PropTypes.func,
    canEditStudy: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.notification = UINotificationService.create({});
    this.uiModelService = UIModalService.create({});
    this.uiDialogService = UIDialogService.create({});
    const { element } = this.props.viewConstants;
    const labelmaps = getLabelMaps(element);
    const segments = flattenLabelmaps(labelmaps);

    this.state = {
      element: element,
      segments: segments,
      selectedSegmentId: segments && segments.length ? segments[0].id : null,
      header: null,
      addedSegmentName: '',
      addedSegmentColor: null,
    };
  }

  getSelectedActiveIndex = () => {
    const id = this.state.selectedSegmentId;
    if (id) {
      let index = id.split('+').map(Number);
      return { id, labelmapIndex: index[0], segmentIndex: index[1] };
    }
    return null;
  };

  onAddSegment = (name, description, color) => {
    this.uiModelService.hide();

    const { element } = this.props.viewConstants;
    const { id } = createSegment(element, name, description, hexToRgb(color));
    this.refreshSegTable(id);

    this.setState({
      addedSegmentName: name,
      addedSegmentColor: color,
    });

    if (this.props.onSegmentCreated) {
      this.props.onSegmentCreated(id);
    }
  };

  onUpdateSegment = (name, description, color) => {
    this.uiModelService.hide();

    const { element } = this.props.viewConstants;
    const activeIndex = this.getSelectedActiveIndex();
    updateSegmentMeta(
      element,
      activeIndex.labelmapIndex,
      activeIndex.segmentIndex,
      name,
      description,
      hexToRgb(color)
    );
    this.refreshSegTable(activeIndex.id);

    if (this.props.onSegmentUpdated) {
      this.props.onSegmentUpdated(activeIndex.id);
    }
  };

  onSelectSegment = evt => {
    let id = evt.currentTarget.value;
    this.setState({ selectedSegmentId: id });
  };

  onClickAddSegment = () => {
    this.uiModelService.show({
      content: SegmentationLabelForm,
      title: 'Add New Segment',
      contentProps: {
        name: randomName(),
        description: '',
        color: randomRGB(),
        onSubmit: this.onAddSegment,
      },
      customClassName: 'segmentationLabelForm',
      shouldCloseOnEsc: true,
    });
  };

  onClickEditSegment = () => {
    const { element } = this.props.viewConstants;
    const activeIndex = this.getSelectedActiveIndex();
    const { name, description, color } = getSegmentInfo(
      element,
      activeIndex.labelmapIndex,
      activeIndex.segmentIndex
    );

    this.uiModelService.show({
      content: SegmentationLabelForm,
      title: 'Edit Label',
      contentProps: {
        name: name,
        description: description,
        color: rgbToHex(
          Math.floor(color[0]),
          Math.floor(color[1]),
          Math.floor(color[2])
        ),
        onSubmit: this.onUpdateSegment,
      },
      customClassName: 'segmentationLabelForm',
      shouldCloseOnEsc: true,
    });
  };

  onUpdateLabelOrDesc = (id, evt, label) => {
    const { element } = this.props.viewConstants;
    let index = id.split('+').map(Number);
    const labelmapIndex = index[0];
    const segmentIndex = index[1];

    updateSegmentMeta(
      element,
      labelmapIndex,
      segmentIndex,
      label ? evt.currentTarget.textContent : undefined,
      label ? undefined : evt.currentTarget.textContent
    );
  };

  onClickDeleteSegment = () => {
    const { element } = this.props.viewConstants;
    const activeIndex = this.getSelectedActiveIndex();

    deleteSegment(element, activeIndex.labelmapIndex, activeIndex.segmentIndex);
    this.setState({ selectedSegmentId: null });
    this.refreshSegTable(null);

    if (this.props.onSegmentDeleted) {
      this.props.onSegmentDeleted(activeIndex.id);
    }
  };

  onClickExportSegments = () => {
    const { getters } = cornerstoneTools.getModule('segmentation');
    const { labelmaps3D } = getters.labelmaps3D(
      this.props.viewConstants.element
    );
    if (!labelmaps3D) {
      console.info('LabelMap3D is empty.. so zero segments');
      return;
    }

    this.notification.show({
      title: 'AI Tools',
      message: 'Preparing the label to download as .nrrd',
      type: 'info',
      duration: 5000,
    });

    for (let i = 0; i < labelmaps3D.length; i++) {
      const labelmap3D = labelmaps3D[i];
      if (!labelmap3D) {
        console.warn('Missing Label; so ignore');
        continue;
      }

      const metadata = labelmap3D.metadata.data
        ? labelmap3D.metadata.data
        : labelmap3D.metadata;
      if (!metadata || !metadata.length) {
        console.warn('Missing Meta; so ignore');
        continue;
      }

      SegmentationReader.serializeNrrd(
        this.state.header,
        labelmap3D.buffer,
        'segment-' + i + '.nrrd'
      );
    }
  };

  refreshSegTable = id => {
    const { element } = this.props.viewConstants;

    const labelmaps = getLabelMaps(element);
    const segments = flattenLabelmaps(labelmaps);
    if (!segments.length) {
      id = undefined;
    } else if (!id) {
      id = segments[segments.length - 1].id;
    }

    if (id) {
      this.setState({ segments: segments, selectedSegmentId: id });
    } else {
      this.setState({ segments: segments });
    }
  };

  setActiveSegment = () => {
    const { element } = this.props.viewConstants;
    const activeIndex = this.getSelectedActiveIndex();

    const { setters } = cornerstoneTools.getModule('segmentation');
    const { labelmapIndex, segmentIndex } = activeIndex;

    setters.activeLabelmapIndex(element, labelmapIndex);
    setters.activeSegmentIndex(element, segmentIndex);

    // Refresh
    cornerstone.updateImage(element);

    if (this.props.onSegmentSelected) {
      this.props.onSegmentSelected(activeIndex.id);
    }
  };

  updateView = async (response, labels, operation, slice, overlap) => {
    const { element, numberOfFrames } = this.props.viewConstants;

    let activeIndex = this.getSelectedActiveIndex();
    const { header, image } = SegmentationReader.parseNrrdData(response.data);
    SegmentationReader.serializeNrrd(header, image, 'result' + '.nrrd');
    this.setState({ header: header });
    if (labels) {
      let i = 0;
      for (var label in labels) {
        if (Array.isArray(labels)) {
          label = labels[label] + '#1';
          this.state.segments.forEach(function(seg) {
            if (seg.meta.SegmentLabel === label) {
              let index = parseInt(seg.meta.SegmentLabel.split('#')[1]);
              label = label.replace(`#${index}`, `#${index + 1}`);
            }
          });
        }

        if (label === 'background') {
          continue;
        }

        //console.log(getLabelColor('spleen'));

        const resp = createSegment(
          element,
          label,
          '',
          getLabelColor(label),
          i === 0 ? !overlap : false
        );
        if (i === 0) {
          activeIndex = resp;
        }
        i++;

        if (this.state.selectedSegmentId) {
          this.refreshSegTable();
        } else {
          this.refreshSegTable(activeIndex.id);
        }
      }
    }
    if (!operation && overlap) {
      operation = 'overlap';
    }

    updateSegment(
      element,
      activeIndex.labelmapIndex,
      activeIndex.segmentIndex,
      image,
      numberOfFrames,
      operation,
      slice
    );
  };

  onClickSubmit = () => {
    this.uiDialogService.create({
      content: SimpleDialog.InputDialog,
      contentProps: {
        defaultValue: 'Segmentation 1',
        title: 'Submission Description',
        onClose: this.onClose,
        onSubmit: this.onClickSubmitLabel,
      },
    });
  };

  onClose = () => {
    this.uiDialogService.dismissAll();
  };

  onClickSubmitLabel = async description => {
    const { getters } = cornerstoneTools.getModule('segmentation');
    const { labelmaps3D } = getters.labelmaps3D(
      this.props.viewConstants.element
    );
    if (!labelmaps3D) {
      console.info('LabelMap3D is empty.. so zero segments');
      return;
    }

    this.notification.show({
      title: `AI Tools - ${description}`,
      message: 'Preparing to submit. This can take a few seconds...',
      type: 'info',
      duration: 10000,
    });

    for (let i = 0; i < labelmaps3D.length; i++) {
      const labelmap3D = labelmaps3D[i];

      if (!labelmap3D) {
        console.warn('Missing Label; so ignore');
        continue;
      }

      const metadata = labelmap3D.metadata.data
        ? labelmap3D.metadata.data
        : labelmap3D.metadata;
      if (!metadata || !metadata.length) {
        console.warn('Missing Meta; so ignore');
        continue;
      }

      let segments = flattenLabelmaps(
        getLabelMaps(this.props.viewConstants.element)
      );

      if (metadata.length !== segments.length + 1) {
        console.warn('Segments and Metadata NOT matching; So Ignore');
        continue;
      }

      const image = this.props.viewConstants.SeriesInstanceUID;
      const label = new Blob([labelmap3D.buffer], {
        type: 'application/octet-stream',
      });

      const params = { label_info: segments, submission_name: description };

      const response = await this.props
        .client()
        .save_label(image, label, params);

      if (response.status !== 201) {
        this.notification.show({
          title: 'AI Tools',
          message: 'Failed to save label',
          type: 'error',
          duration: 10000,
        });
      } else {
        this.notification.show({
          title: 'AI Tools',
          message: 'Segmentation series submitted to server',
          type: 'success',
          duration: 10000,
        });
      }
      this.refreshSegTable();
    }
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.selectedSegmentId !== this.state.selectedSegmentId) {
      if (this.state.selectedSegmentId) {
        this.setActiveSegment();
      }
    }
  }

  render() {
    const segmentId = this.state.selectedSegmentId
      ? this.state.selectedSegmentId
      : getFirstSegmentId(this.props.viewConstants.element);
    console.log('render seg list: ' + segmentId);

    return (
      <div className="segmentationList">
        <table>
          <tbody>
            <tr>
              <td>
                <button
                  className="segButton"
                  onClick={this.onClickAddSegment}
                  title="Add Segment"
                >
                  <Icon name="plus" width="12px" height="12px" />
                </button>
                &nbsp;
                <button
                  className="segButton"
                  onClick={this.onClickEditSegment}
                  title="Edit Selected Segment"
                  disabled={!segmentId}
                >
                  <Icon name="edit" width="12px" height="12px" />
                </button>
                &nbsp;
                <button
                  className="segButton"
                  onClick={this.onClickDeleteSegment}
                  title="Clear Selected Segment"
                  disabled={!segmentId}
                >
                  <Icon name="trash" width="12px" height="12px" />
                </button>
              </td>

              <td align="right">
                {this.state.header ? (
                  <button
                    className="segButton"
                    onClick={this.onClickExportSegments}
                    title={'Download Segment'}
                  >
                    <Icon name="save" width="12px" height="12px" />
                  </button>
                ) : null}
                &nbsp;
                {localStorage.getItem('HealthProfessional_Authenticated') &&
                this.props.canEditStudy ? (
                  <button
                    className="segButton"
                    onClick={this.onClickSubmit}
                    title={'Submit Segment to Database'}
                    disabled={!segmentId}
                  >
                    <Icon name="database" width="12px" height="12px" />
                  </button>
                ) : null}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="segSection">
          <table className="segTable">
            <thead>
              <tr>
                <th width="2%">#</th>
                <th width="18%">Color</th>
                <th width="80%">Name</th>
              </tr>
            </thead>
            <tbody>
              {this.state.segments.map(seg => (
                <tr key={seg.id}>
                  <td>
                    <input
                      type="radio"
                      name="segitem"
                      value={seg.id}
                      checked={seg.id === this.state.selectedSegmentId}
                      onChange={this.onSelectSegment}
                    />
                  </td>
                  <td>
                    <ColoredCircle color={seg.color} />
                  </td>
                  <td
                    className="segEdit"
                    contentEditable="true"
                    suppressContentEditableWarning="true"
                    onKeyUp={evt => this.onUpdateLabelOrDesc(seg.id, evt, true)}
                  >
                    {seg.meta.SegmentLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {this.state.addedSegmentName && this.state.addedSegmentColor ? (
          <p
            style={{
              color: this.state.addedSegmentColor,
              marginTop: '10px',
            }}
          >
            <b>*</b> Now, you can draw the segment{' '}
            <b>{this.state.addedSegmentName}</b> using the Segmentation tools
            available in the Toolbar.
          </p>
        ) : null}
      </div>
    );
  }
}
