/* eslint-disable react/prop-types */
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AceEditor from 'react-ace';
import 'ace-builds/src-min-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/snippets/python';
import 'ace-builds/src-noconflict/theme-dracula';
import Tree from './Tree/Tree';
import template from './template.js';
import Button from '@material-ui/core/Button';
import SaveIcon from '@material-ui/icons/Save';
import CloudDownload from '@material-ui/icons/CloudDownload';
import { saveAs } from 'file-saver';
import ConnectedAPI from '../components/ConnectedAPI';
import { UIModalService } from '@ohif/core';

class Editor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tree: [
        {
          type: 'folder',
          name: this.props.location.state.name,
          files: [
            { type: 'file', name: '__init__.py' },
            { type: 'file', name: 'main.py' },
            { type: 'file', name: 'requirements.txt' },
            { type: 'file', name: 'template' },
          ],
        },
      ],
      '__init__.py': '',
      'main.py': '',
      'requirements.txt': '',
      template: template,
      active: 'template',
      preTrainedFiles: [],
    };

    this.uiModelService = UIModalService.create({});
  }

  static propTypes = {
    user: PropTypes.object,
  };

  async componentDidMount() {
    if (this.props.location.state.file !== undefined) {
      this.uiModelService.hide();
      let fileName = this.props.location.state.file;

      let url = `http://localhost:8000/api/model/?user=${this.props.user.email}&file=${fileName}`;

      var req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.responseType = 'blob';
      req.setRequestHeader(
        'Authorization',
        `JWT ${localStorage.getItem('access')}`
      );
      req.send();

      const scope = this;
      req.onload = () => {
        const zip = require('jszip')();
        var blob = req.response;
        zip.loadAsync(blob).then(async function(zip) {
          for (let fileName in zip.files) {
            let fileNamePlusExtension = fileName.split('.');
            let extension = fileNamePlusExtension[1];
            let preTrainedModelExt = ['ts', 'pl', 'hdf5', 'npy', 'pth', 'pt'];
            if (preTrainedModelExt.includes(extension)) {
              var fileBlob = await zip.file(fileName).async('blob');
              var file = new File([fileBlob], fileName);

              scope.setState({
                [fileName]:
                  '#The file is not displayed in the editor because it is binary.',
              });
              scope.state['preTrainedFiles'].push({
                [fileName]: file,
              });
            } else {
              var fileString = await zip.file(fileName).async('string');
              scope.setState({
                [fileName]: fileString,
              });
            }
            let treeFiles = [
              '__init__.py',
              'main.py',
              'requirements.txt',
              'template',
            ];

            if (!treeFiles.includes(fileName)) {
              scope.state['tree'][0]['files'].push({
                type: 'file',
                name: fileName,
              });
            }
            //console.log(scope.state.preTrainedFiles);
          }
        });
      };
    }
  }

  handleTreeClick = node => {
    Object.keys(this.state).forEach(key => {
      if (node['node']['name'] === key) {
        this.setState({ active: node['node']['name'] });
      }
    });
  };

  onDelete = name => {
    let file = this.state['tree'][0]['files'].filter(function(el) {
      return el.type === 'file' && el.name === name;
    });

    const index = this.state['tree'][0]['files'].indexOf(file[0]);

    this.state['tree'][0]['files'].splice(index, 1);

    //console.log(this.state['tree'][0]['files']);
  };

  onAdd = name => {
    this.setState({
      [name]: '',
      active: name,
    });
  };

  handleChange = newValue => {
    let active = this.state.active;
    this.setState({
      [active]: newValue,
    });
  };

  handleModelUpload = e => {
    for (let f = 0; f < e.target.files.length; f++) {
      this.state['preTrainedFiles'].push({
        [e.target.files[f]['name']]: e.target.files[f],
      });
    }
  };

  handleDownload = () => {
    const zip = require('jszip')();
    let files_list = [];
    let fileNames = [];

    for (let f = 0; f < this.state.preTrainedFiles.length; f++) {
      let modelFile = this.state.preTrainedFiles[f];
      let filename = Object.keys(modelFile)[0];

      if (modelFile[filename] instanceof File) {
        files_list.push(modelFile);
        fileNames.push(Object.keys(modelFile)[0]);
      }
    }

    let list = this.state.tree[0]['files'];
    for (let f = 0; f < list.length; f++) {
      if (!fileNames.includes(list[f]['name'])) {
        let fileContent = this.state[list[f]['name']];

        let blobFile = new Blob([fileContent], {
          type: 'text/plain;charset=utf-8',
        });
        const content = {};
        content[list[f]['name']] = blobFile;
        files_list.push(content);
      }
    }

    let parentFolder = this.state.tree;

    for (let f = 0; f < files_list.length; f++) {
      for (const [name, file] of Object.entries(files_list[f])) {
        zip.file(name, file);
      }
    }

    zip.generateAsync({ type: 'blob' }).then(content => {
      saveAs(content, parentFolder[0]['name']);
    });
  };

  handleSubmit = () => {
    const zip = require('jszip')();
    let files = [];
    let fileNames = [];

    for (let f = 0; f < this.state.preTrainedFiles.length; f++) {
      let modelFile = this.state.preTrainedFiles[f];
      let filename = Object.keys(modelFile)[0];

      if (modelFile[filename] instanceof File) {
        files.push(modelFile);
        fileNames.push(Object.keys(modelFile)[0]);
        //console.log(files);
        //console.log(fileNames);
      }
    }

    let list = this.state.tree[0]['files'];
    for (let f = 0; f < list.length; f++) {
      if (!fileNames.includes(list[f]['name'])) {
        let fileContent = this.state[list[f]['name']];

        let blobFile = new Blob([fileContent], {
          type: 'text/plain;charset=utf-8',
        });
        const content = {};
        content[list[f]['name']] = blobFile;
        files.push(content);
      }
    }
    let parentFolder = this.state.tree;

    for (let f = 0; f < files.length; f++) {
      for (const [name, file] of Object.entries(files[f])) {
        zip.file(name, file);
      }
    }

    zip.generateAsync({ type: 'blob' }).then(content => {
      const form = this.props.location.state;

      let data = {};

      data['name'] = form.name;
      data['port'] = form.port;
      data['version'] = form.version;
      data['algorithm_overview'] = form.algorithm_overview;
      data['model_architecture'] = form.model_architecture;
      data['model_performance'] = form.model_performance;
      data['data_description'] = form.data_description;
      data['input'] = form.input;
      data['output'] = form.output;
      data['references'] = form.references;
      data['additional_info'] = form.additional_info;
      data['file'] = [parentFolder[0]['name'], content];
      data['user'] = form.user;
      data['task'] = form.task;
      data['inputExtension'] = form.inputExtension;
      data['inputModality'] = form.inputModality;
      data['visibility'] = form.visibility;
      data['framework'] = form.framework;
      data['bodyPart'] = form.bodyPart;

      ConnectedAPI.createMyModelEntry(data);
    });
  };

  render() {
    let active = this.state.active;
    let activeContent = this.state[`${active}`];
    return (
      <Fragment>
        <div style={{ display: 'flex' }}>
          <div style={{ marginRight: '10px' }}>
            <Tree
              data={this.state.tree}
              onNodeClick={this.handleTreeClick}
              onDelete={this.onDelete}
              onAdd={this.onAdd}
            />
          </div>

          <div style={{ flex: '0%' }}>
            <div
              className="buttons"
              style={{ width: '200px', margin: '0 auto', display: 'inline' }}
            >
              <label
                htmlFor="file"
                style={{
                  marginBottom: '5px',
                  fontSize: '12px',
                  fontFamily: 'Helvetica',
                }}
              >
                <input
                  title="Upload Pre-trained Model Files"
                  type="file"
                  name="file"
                  id="file"
                  multiple
                  accept=".ts, .pl. .hdf5, .npy, .pth, .pt"
                  onChange={e => {
                    this.handleModelUpload(e);
                  }}
                />
              </label>

              <h4
                style={{
                  fontSize: '14px',
                  fontFamily: 'Helvetica',
                  display: 'inline',
                  margin: '0 auto',
                  marginLeft: '20%',
                }}
              >
                <b>{this.state.active}</b>
              </h4>

              <Button
                style={{
                  marginTop: '6px',
                  marginRight: '8px',
                  fontSize: '12px',
                  fontFamily: 'Helvetica',
                  float: 'right',
                  display: 'flex',
                  backgroundColor: '#ff4500',
                  borderColor: '#FFFAFA',
                }}
                onClick={this.handleSubmit}
                startIcon={<SaveIcon />}
                variant="outlined"
              >
                Publish
              </Button>
              <Button
                style={{
                  marginTop: '6px',
                  marginRight: '8px',
                  fontSize: '12px',
                  fontFamily: 'Helvetica',
                  float: 'right',
                  display: 'flex',
                  backgroundColor: '#00BFFF',
                  borderColor: '#FFFAFA',
                }}
                onClick={this.handleDownload}
                startIcon={<CloudDownload />}
                variant="outlined"
              >
                Download
              </Button>
            </div>

            <AceEditor
              mode="python"
              theme="dracula"
              onChange={this.handleChange}
              name="editor"
              value={activeContent}
              enableBasicAutocompletion={true}
              enableLiveAutocompletion={true}
              enableSnippets={true}
              width="100%"
              height="520px"
              showPrintMargin={false}
              highlightActiveLine={true}
              readOnly={this.state.active === 'template'}
            />
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  user: state.auth.user,
});

const ConnectedEditor = connect(
  mapStateToProps,
  null
)(Editor);

export default ConnectedEditor;
