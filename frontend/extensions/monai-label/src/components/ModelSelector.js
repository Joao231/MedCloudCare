/* eslint-disable react/prop-types */
/* eslint-disable no-useless-escape */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './ModelSelector.styl';

class ModelSelector extends Component {
  static propTypes = {
    info: PropTypes.array,
    models: PropTypes.array,
    currentModel: PropTypes.string,
    onClick: PropTypes.func,
    onSelectModel: PropTypes.func,
    user: PropTypes.object,
    useFilter: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    const currentModel = props.currentModel
      ? props.currentModel
      : props.models.length > 0
      ? props.models[0]
      : '';

    let currentModelInfo = null;

    props.info.forEach(function(model) {
      if (model['name'] === currentModel) {
        currentModelInfo = model;
      }
    });

    this.state = {
      models: props.models,
      currentModel: currentModel,
      buttonDisabled: false,
      currentModelInfo: currentModelInfo,
      filterBodyPart: '',
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    if (current_state.models !== props.models) {
      return {
        models: props.models,
        currentModel: props.models.length > 0 ? props.models[0] : '',
      };
    }
    return null;
  }

  onChangeModel = evt => {
    let currentModelInfo = null;
    this.props.info.forEach(function(model) {
      if (model['name'] === evt.target.value) {
        currentModelInfo = model;
      }
    });
    this.setState({
      currentModel: evt.target.value,
      currentModelInfo: currentModelInfo,
    });

    if (this.props.onSelectModel) this.props.onSelectModel(evt.target.value);
  };

  handleFilterChange = value => {
    if (this.props.handleFilterChange) {
      this.setState({ filterBodyPart: value });
      this.props.handleFilterChange(value);
    }
  };

  currentModel = () => {
    return this.props.currentModel
      ? this.props.currentModel
      : this.state.currentModel;
  };

  onClickBtn = async () => {
    if (this.state.buttonDisabled) {
      return;
    }

    let model = this.state.currentModel;
    if (!model) {
      model = this.props.models.length > 0 ? this.props.models[0] : '';
    }

    this.setState({ buttonDisabled: true });
    await this.props.onClick(model);
    this.setState({ buttonDisabled: false });
  };

  onClickApply = async () => {
    if (this.props.onClickApply) {
      this.props.onClickApply();
    }
  };

  render() {
    const { user, useFilter } = this.props;
    const currentModel = this.currentModel();
    const modelInfo = this.state.currentModelInfo;

    let hasPerm = false;
    let references = '';
    let res = [];

    if (modelInfo !== null) {
      let modelOwner = modelInfo['user'];
      let userPermissionsOnModel = modelInfo['user_permissions'];
      if (
        modelOwner === user.email ||
        userPermissionsOnModel.includes('Test Models') ||
        localStorage.getItem('HealthProfessional_Authenticated')
      ) {
        hasPerm = true;
      }
      references = modelInfo.references;
      const matchingString = new RegExp(
        `(http|https)://((\.)|[a-z]|[0-9]|/|_)*`,
        'gmi'
      );

      if (matchingString.test(references)) {
        let matches = references.match(matchingString);

        for (let i = 0; i < matches.length; i++) {
          if (matches[i].lastIndexOf('.') === matches[i].length - 1) {
            matches[i] = matches[i].substring(0, matches[i].length - 1);
          }
          res.push(matches[i]);
        }
      }
    }

    return (
      <div
        className="modelSelector"
        style={{ marginLeft: 'auto', marginRight: '5px' }}
      >
        <table>
          <tbody>
            <tr>
              <td colSpan="3">
                Available Models <b>({this.props.models.length})</b>:
              </td>
            </tr>
            <tr>
              <td width="80%">
                <select
                  className="selectBox"
                  onChange={this.onChangeModel}
                  value={currentModel}
                  style={{
                    borderRadius: '5px',
                    marginBottom: '10px',
                    marginTop: '10px',
                  }}
                >
                  {this.props.models.map(model => (
                    <option key={model} name={model} value={model}>
                      {`${model} `}
                    </option>
                  ))}
                </select>
              </td>
              <td width="2%">&nbsp;</td>
              {hasPerm ? (
                <td width="18%">
                  <button
                    className="actionButton"
                    onClick={this.onClickBtn}
                    title={'Run Algorithm'}
                    disabled={
                      this.state.isButtonDisabled || !this.props.models.length
                    }
                    style={{
                      display: this.props.onClick ? 'block' : 'none',
                      marginLeft: '10px',
                    }}
                  >
                    Run
                  </button>
                </td>
              ) : null}
            </tr>

            {useFilter ? (
              <>
                <td>&nbsp;</td>
                <tr>
                  <td colSpan="3">Body Part Examined:</td>
                </tr>

                <tr>
                  <td width="80%">
                    <input
                      type="text"
                      id={`filter-bodyPart`}
                      className="selectBox"
                      value={this.state.filterBodyPart}
                      placeholder={'Filter...'}
                      onChange={e => this.handleFilterChange(e.target.value)}
                    />
                  </td>

                  <td width="2%">&nbsp;</td>

                  <td width="18%">
                    <button
                      className="actionButton"
                      onClick={this.onClickApply}
                      title={'Run Algorithm'}
                      disabled={!this.props.models.length}
                      style={{
                        display: this.props.onClick ? 'block' : 'none',
                        marginLeft: '10px',
                      }}
                    >
                      Apply
                    </button>
                  </td>

                  <td>&nbsp;</td>
                </tr>
              </>
            ) : null}
          </tbody>
        </table>
        <p></p>

        {this.props.models.length > 0 ? <h5>Model Information</h5> : null}
        <p></p>
        {modelInfo ? (
          <table>
            <tbody>
              <tr>
                <th>Algorithm Name</th>
                <th>{modelInfo.name}</th>
              </tr>
              <tr>&nbsp;</tr>

              <tr>
                <th>Task</th>
                <th>{modelInfo.task}</th>
              </tr>
              <tr>&nbsp;</tr>

              <tr>
                <th>Body Part Examined</th>
                <th>{modelInfo.bodyPart}</th>
              </tr>
              <tr>&nbsp;</tr>

              <tr>
                <th>Version</th>
                <th>{modelInfo.version}</th>
              </tr>
              <tr>&nbsp;</tr>

              <tr>
                <th>Algorithm Overview</th>
                <th>{modelInfo.algorithm_overview}</th>
              </tr>
              <tr>&nbsp;</tr>

              <tr>
                <th>Model Architecture</th>
                <th>{modelInfo.model_architecture}</th>
              </tr>
              <tr>&nbsp;</tr>

              <tr>
                <th>References</th>
                <div className="refs">
                  {res.map(ref => (
                    <>
                      <th key={ref}>
                        <a
                          key={ref}
                          className="newbutton"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={ref}
                          style={{ overflow: 'hidden', wordBreak: 'break-all' }}
                        >
                          {ref}
                        </a>
                      </th>
                      <br></br>
                    </>
                  ))}
                </div>
              </tr>
              <tr>&nbsp;</tr>

              <tr>
                <th>Model Performance</th>
                <th>{modelInfo.model_performance}</th>
              </tr>
              <tr>&nbsp;</tr>

              <tr>
                <th>Data Description</th>
                <th>{modelInfo.data_description}</th>
              </tr>
              <tr>&nbsp;</tr>

              <tr>
                <th>Input</th>
                <th>{modelInfo.input}</th>
              </tr>
              <tr>&nbsp;</tr>

              <tr>
                <th>Input Modality</th>
                <th>{modelInfo.inputModality}</th>
              </tr>
              <tr>&nbsp;</tr>

              <tr>
                <th>Output</th>
                <th>{modelInfo.output}</th>
              </tr>
              <tr>&nbsp;</tr>

              <tr>
                <th>Additional Info</th>
                <th>{modelInfo.additional_info}</th>
              </tr>
              <tr>&nbsp;</tr>

              <tr>
                <th>Created at</th>
                <th>{modelInfo.created_at}</th>
              </tr>
              <tr>&nbsp;</tr>
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

export default ModelSelector;
