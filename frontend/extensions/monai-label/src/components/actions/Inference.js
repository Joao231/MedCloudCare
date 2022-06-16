import React from 'react';
import './Inference.styl';
import ModelSelector from '../ModelSelector';
import BaseTab from './BaseTab';
import { connect } from 'react-redux';
import { utils } from '@ohif/core';
import bodyParts from '../../../../../platform/viewer/src/components/bodyParts';
const { studyMetadataManager } = utils;

class Inference extends BaseTab {
  constructor(props) {
    super(props);

    this.server_url = new URL('http://localhost/');
    this.modelSelector = React.createRef();
    this.state = {
      currentModel: null,
    };
  }

  onSelectModel = model => {
    this.setState({ currentModel: model });
  };

  onInference = async () => {
    const nid = this.notification.show({
      title: 'AI Tools',
      message: 'Running Inference...',
      type: 'info',
      duration: 100000,
    });
    const { viewConstants } = this.props;

    const model = this.modelSelector.current.currentModel();

    let task = '';
    let port = '';
    let inputExtension = '';

    this.props.info.forEach(function(algo) {
      if (algo['name'] == model) {
        task = algo['task'];
        port = algo['port'];
        inputExtension = algo['inputExtension'];
      }
    });

    const image = viewConstants.SeriesInstanceUID;

    let response = null;

    if (task == 'Segmentation') {
      response = await this.props.client().segmentation(model, image, {
        port: port,
        inputExtension: inputExtension,
        task: task,
      });
    } else if (task == 'Classification') {
      response = await this.props.client().classification(model, image, {
        port: port,
        inputExtension: inputExtension,
        task: task,
      });
    } else if (task == 'Image Registration') {
      let layoutViewports = viewConstants.viewports;
      if (Object.keys(layoutViewports).length === 2) {
        let seriesIds = '';
        Object.keys(layoutViewports).forEach(key => {
          seriesIds = seriesIds + 'S' + layoutViewports[key].SeriesInstanceUID;
        });
        seriesIds = seriesIds.substr(1);

        response = await this.props.client().registration(model, seriesIds, {
          port: port,
          inputExtension: inputExtension,
          task: task,
        });
      } else {
        alert(
          'Failed to Run Image Registration. You must select 2 series in the Layout!'
        );
      }
    } else {
      response = await this.props.client().segmentation(model, image, {
        port: port,
        inputExtension: inputExtension,
        task: task,
      });
    }

    if (!nid) {
      window.snackbar.hideAll();
    } else {
      this.notification.hide(nid);
    }

    if (response) {
      if (response.status !== 200) {
        this.notification.show({
          title: 'AI Tools',
          message: 'Failed to Run Inference',
          type: 'error',
          duration: 8000,
        });
      } else {
        this.notification.show({
          title: 'AI Tools',
          message: 'Run Inference - Successful',
          type: 'success',
          duration: 8000,
        });
      }
      await this.props.updateView(response, [`${model}_result`], task);
    }
  };

  render() {
    const { user, viewConstants } = this.props;
    let modality;
    let useFilter = true;

    const studyMetadata = studyMetadataManager.get(
      viewConstants.StudyInstanceUID
    );
    const displaySets = studyMetadata.getDisplaySets();
    const activeDisplaySet = displaySets.find(
      ds => ds.displaySetInstanceUID === viewConstants.displaySetInstanceUID
    );

    const { images } = activeDisplaySet;
    const image = images[0];
    let metadata = image.getData().metadata;
    let bodyPart;
    let bodyPartDescription = '';
    if (Object.keys(metadata).includes('BodyPartExamined')) {
      bodyPart = metadata['BodyPartExamined'];
      bodyPartDescription = Object.keys(bodyParts).find(
        key => bodyParts[key] === bodyPart
      );
    }

    console.log('Body Part:', bodyPartDescription);

    Object.keys(viewConstants.viewports).forEach(key => {
      modality = viewConstants.viewports[key].Modality;
    });
    let models = [];
    if (this.props.info) {
      if (user && localStorage.getItem('HealthProfessional_Authenticated')) {
        let modelsAvailableHealthProfessionals = [
          'clara-pt-spleen-ct-segmentation',
          'left-atrium-segmentation',
          'mr-classification',
        ];
        this.props.info.forEach(function(model) {
          let modelInputModality = model['inputModality'].split('-')[0];
          modelInputModality = modelInputModality.replace(' ', '');
          if (
            modelsAvailableHealthProfessionals.includes(model['name']) &&
            modelInputModality === modality
          ) {
            if (
              bodyPartDescription !== '' &&
              model['bodyPart'] === bodyPartDescription
            ) {
              useFilter = false;
              models.push(model['name']);
            } else if (bodyPartDescription === '') {
              models.push(model['name']);
            }
          }
        });
      } else if (user && localStorage.getItem('Investigator_Authenticated')) {
        this.props.info.forEach(function(model) {
          let modelInputModality = model['inputModality'].split('-')[0];
          modelInputModality = modelInputModality.replace(' ', '');
          if (modelInputModality === modality) {
            if (
              bodyPartDescription !== '' &&
              model['bodyPart'] === bodyPartDescription
            ) {
              models.push(model['name']);
            } else if (bodyPartDescription === '') {
              models.push(model['name']);
            }
          }
        });
      }
    }

    return (
      <div className="tab-content">
        <ModelSelector
          ref={this.modelSelector}
          info={this.props.info}
          models={models}
          currentModel={this.state.currentModel}
          onClick={this.onInference}
          onSelectModel={this.onSelectModel}
          user={user}
          useFilter={useFilter}
          handleFilterChange={this.props.handleFilterChange}
          onClickApply={this.props.onClickApply}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  user: state.auth.user,
});

const ConnectedInference = connect(
  mapStateToProps,
  null
)(Inference);

export default ConnectedInference;
