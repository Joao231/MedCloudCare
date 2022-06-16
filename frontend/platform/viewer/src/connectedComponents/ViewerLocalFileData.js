import React, { Component } from 'react';
import { metadata, utils } from '@ohif/core';
import ConnectedViewer from './ConnectedViewer.js';
import PropTypes from 'prop-types';
import { extensionManager } from './../App.js';
import Dropzone from 'react-dropzone';
import filesToStudies from '../lib/filesToStudies';
import './ViewerLocalFileData.css';
import ViewerNrrd from './ViewerNrrd.js';
const { OHIFStudyMetadata } = metadata;
const { studyMetadataManager } = utils;

const dropZoneLinkDialog = (onDrop, dir) => {
  return (
    <Dropzone onDrop={onDrop} noDrag>
      {({ getRootProps, getInputProps }) => (
        <span {...getRootProps()} className="link-dialog">
          {dir ? (
            <span>
              Load folders
              <input
                {...getInputProps()}
                webkitdirectory="true"
                mozdirectory="true"
              />
            </span>
          ) : (
            <span>
              Load files
              <input {...getInputProps()} />
            </span>
          )}
        </span>
      )}
    </Dropzone>
  );
};

const linksDialogMessage = onDrop => {
  return (
    <>
      Or click to {` `}
      {dropZoneLinkDialog(onDrop)}
      {` `} or {` `}
      {dropZoneLinkDialog(onDrop, true)}
      {` `} from dialog
    </>
  );
};

class ViewerLocalFileData extends Component {
  constructor() {
    super();

    this.state = {
      studies: null,
      loading: false,
      error: null,
      nrrdFile: null,
      scale: null,
      slice: null,
      stackSize: null,
      wwwc: null,
      size: null,
    };
  }
  static propTypes = {
    studies: PropTypes.array,
  };

  updateStudies = studies => {
    // Render the viewer when the data is ready
    studyMetadataManager.purge();

    // Map studies to new format, update metadata manager?
    const updatedStudies = studies.map(study => {
      const studyMetadata = new OHIFStudyMetadata(
        study,
        study.StudyInstanceUID
      );
      const sopClassHandlerModules =
        extensionManager.modules['sopClassHandlerModule'];

      study.displaySets =
        study.displaySets ||
        studyMetadata.createDisplaySets(sopClassHandlerModules);

      studyMetadata.forEachDisplaySet(displayset => {
        displayset.localFile = true;
      });

      studyMetadataManager.add(studyMetadata);

      return study;
    });

    this.setState({
      studies: updatedStudies,
    });
  };

  render() {
    const onDrop = async acceptedFiles => {
      this.setState({ loading: true });

      let oneFile = acceptedFiles[0];

      if (oneFile['name'].includes('.nrrd')) {
        this.setState({
          studies: [],
          loading: false,
          nrrdFile: oneFile,
          isNrrdImage: true,
        });
      } else {
        const studies = await filesToStudies(acceptedFiles);

        const updatedStudies = this.updateStudies(studies);

        if (!updatedStudies) {
          return;
        }

        this.setState({
          studies: updatedStudies,
          loading: false,
          isNrrdImage: false,
        });
      }
    };

    if (this.state.error) {
      return <div>Error: {JSON.stringify(this.state.error)}</div>;
    }

    return (
      <Dropzone onDrop={onDrop} noClick>
        {({ getRootProps }) => (
          <div {...getRootProps()}>
            {this.state.studies && !this.state.isNrrdImage ? (
              <ConnectedViewer
                studies={this.state.studies}
                studyInstanceUIDs={
                  this.state.studies &&
                  this.state.studies.map(a => a.StudyInstanceUID)
                }
                isNrrdImage={this.state.isNrrdImage}
              />
            ) : this.state.isNrrdImage && this.state.nrrdFile ? (
              <ViewerNrrd
                studies={this.state.studies}
                isStudyLoaded={true}
                nrrdFile={this.state.nrrdFile}
              />
            ) : (
              <div className={'drag-drop-instructions'}>
                <div className={'drag-drop-contents'}>
                  {this.state.loading ? (
                    <h3>Loading...</h3>
                  ) : (
                    <>
                      <h3>
                        Drag and Drop DICOM files here to load them in the
                        Viewer
                      </h3>
                      <h4>{linksDialogMessage(onDrop)}</h4>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Dropzone>
    );
  }
}

export default ViewerLocalFileData;
