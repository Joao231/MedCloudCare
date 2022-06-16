import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { TabFooter } from '@ohif/ui';
import { Form, Field } from '@progress/kendo-react-form';
import { Input, TextArea } from '@progress/kendo-react-inputs';
import axiosInstance from 'axios';
import { UINotificationService } from '@ohif/core';
import './ModelContent.styl';

class ModelContent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      redirect: false,
      name: this.props.info[0].name,
      version: this.props.info[0].version,
      port: this.props.info[0].port,
      algorithm_overview: this.props.info[0].algorithm_overview,
      model_architecture: this.props.info[0].model_architecture,
      model_performance: this.props.info[0].model_performance,
      data_description: this.props.info[0].data_description,
      input: this.props.info[0].input,
      inputModality: this.props.info[0].inputModality,
      output: this.props.info[0].output,
      references: this.props.info[0].references,
      additional_info: this.props.info[0].additional_info,
      user: this.props.info[0].user,
      task: this.props.info[0].task,
      created_at: this.props.info[0].created_at,
      last_modification_at: this.props.info[0].last_modification_at,
      last_modification_by: this.props.info[0].last_modification_by,
      visibility: this.props.info[0].visibility,
      file: this.props.info[0].file,
      bodyPart: this.props.info[0].bodyPart,
    };
  }

  static propTypes = {
    user: PropTypes.object,
    info: PropTypes.array,
    onClose: PropTypes.func,
    history: PropTypes.object,
  };

  FormTextArea = fieldRenderProps => {
    const { max, value, ...others } = fieldRenderProps;

    return (
      <div className={'k-form-field-wrap'}>
        <TextArea
          autoSize={true}
          value={value}
          maxLength={max}
          rows={3}
          {...others}
        />

        <div className="counter">
          {value.length} / {max}
        </div>
      </div>
    );
  };

  CustomInput = ({ fieldType, ...others }) => {
    return (
      <div>
        <Input type={fieldType} {...others} />
        <this.ValidationMessage {...others} />
      </div>
    );
  };

  ValidationMessage = ({ valid, visited, validationMessage }) => {
    return (
      <>
        {!valid && visited && (
          <div className="required">{validationMessage}</div>
        )}
      </>
    );
  };

  requiredValidator = value => {
    return value ? '' : 'This field is required';
  };

  onResetPreferences = () => {
    this.setState({
      redirect: false,
      name: this.props.info[0].name,
      version: this.props.info[0].version,
      port: this.props.info[0].port,
      algorithm_overview: this.props.info[0].algorithm_overview,
      model_architecture: this.props.info[0].model_architecture,
      model_performance: this.props.info[0].model_performance,
      data_description: this.props.info[0].data_description,
      input: this.props.info[0].input,
      inputModality: this.props.info[0].inputModality,
      output: this.props.info[0].output,
      references: this.props.info[0].references,
      additional_info: this.props.info[0].additional_info,
      user: this.props.info[0].user,
      task: this.props.info[0].task,
      created_at: this.props.info[0].created_at,
      visibility: this.props.info[0].visibility,
      last_modification_at: this.props.info[0].last_modification_at,
      last_modification_by: this.props.info[0].last_modification_by,
      bodyPart: this.props.info[0].bodyPart,
    });
  };

  onClose = () => {
    this.props.onClose();
  };

  goToEditor = () => {
    this.setState({ redirect: true });
  };

  deleteRecord = async () => {
    let notification = UINotificationService.create({});
    const response = await axiosInstance
      .get(
        `/api/model_delete/?algorithm=${this.state.name}`,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `JWT ${localStorage.getItem('access')}`,
          },
        }
      )
      .then(res => {
        return res;
      })
      .catch(error => {
        return error.response;
      });

    if (response.status === 200) {
      notification.show({
        title: 'Delete Algorithm',
        message: 'Algorithm deleted - Success!',
        type: 'success',
        duration: 6000,
      });
      this.props.onClose();
    } else if (response.status === 500) {
      notification.show({
        title: 'Delete Algorithm',
        message: 'Failed to delete algorithm!',
        type: 'error',
        duration: 10000,
      });
    }
  };

  onSave = async formRenderProps => {
    let notification = UINotificationService.create({});

    let url = `/api/model/?user=${this.props.user.email}`;

    let form_data = new FormData();

    form_data.append('name', formRenderProps['name']);
    form_data.append('port', formRenderProps['port']);
    form_data.append('version', formRenderProps['version']);
    form_data.append(
      'algorithm_overview',
      formRenderProps['algorithm_overview']
    );
    form_data.append(
      'model_architecture',
      formRenderProps['model_architecture']
    );
    form_data.append('model_performance', formRenderProps['model_performance']);
    form_data.append('data_description', formRenderProps['data_description']);
    form_data.append('input', formRenderProps['input']);
    form_data.append('inputModality', formRenderProps['inputModality']);
    form_data.append('output', formRenderProps['output']);
    form_data.append('references', formRenderProps['references']);
    form_data.append('additional_info', formRenderProps['additional_info']);
    form_data.append('bodyPart', formRenderProps['bodyPart']);

    const response = await axiosInstance
      .put(url, form_data, {
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

    if (response.status === 200) {
      notification.show({
        title: 'Edit Algorithm',
        message: 'Algorithm edited - Success!',
        type: 'success',
        duration: 6000,
      });
    } else if (response.status === 500) {
      notification.show({
        title: 'Edit Algorithm',
        message: 'Failed to edit algorithm!',
        type: 'error',
        duration: 10000,
      });
    }
  };

  render() {
    let visibility = this.state.visibility;
    let caption = '';
    if (visibility === true) {
      caption = 'Public';
    } else if (visibility === false) {
      caption = 'Private';
    }
    return (
      <>
        <div className="ModelContent" data-cy="about-modal">
          <Form
            initialValues={{
              name: this.state.name,
              version: this.state.version,
              bodyPart: this.state.bodyPart,
              algorithm_overview: this.state.algorithm_overview,
              model_architecture: this.state.model_architecture,
              model_performance: this.state.model_performance,
              data_description: this.state.data_description,
              input: this.state.input,
              inputModality: this.state.inputModality,
              output: this.state.output,
              references: this.state.references,
              additional_info: this.state.additional_info,
              user: this.state.user,
              task: this.state.task,
              created_at: this.state.created_at,
              visibility: this.state.visibility,
              last_modification_at: this.state.last_modification_at,
              last_modification_by: this.state.last_modification_by,
            }}
            onSubmit={this.onSave}
            render={formRenderProps => (
              <form className="formModel" onSubmit={formRenderProps.onSubmit}>
                <div className="header">
                  <button
                    className="btn btn-danger pull-left"
                    onClick={this.goToEditor}
                    title="Go to Code Editor"
                  >
                    {'Edit code'}
                  </button>

                  <button
                    className="btn btn-default"
                    onClick={this.deleteRecord}
                    title="Delete Algorithm"
                  >
                    {'Delete'}
                  </button>
                </div>
                <table className="table table-responsive">
                  <tbody>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="title">{'Algorithm Name'}</td>
                      <td>
                        <input
                          style={{ textAlign: 'center' }}
                          readOnly={true}
                          type="text"
                          value={formRenderProps.valueGetter('name')}
                          className={'preferencesInput'}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="title">{'Task'}</td>
                      <td>
                        <input
                          style={{ textAlign: 'center' }}
                          readOnly={true}
                          type="text"
                          value={formRenderProps.valueGetter('task')}
                          className={'preferencesInput'}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="title">{'Body Part Examined'}</td>
                      <td>
                        <input
                          style={{ textAlign: 'center' }}
                          readOnly={true}
                          type="text"
                          value={formRenderProps.valueGetter('bodyPart')}
                          className={'preferencesInput'}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="title">{'Visibility'}</td>
                      <td>
                        <input
                          style={{ textAlign: 'center' }}
                          readOnly={true}
                          type="text"
                          value={caption}
                          className={'preferencesInput'}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="title">{'Created At'}</td>
                      <td>
                        <input
                          style={{ textAlign: 'center' }}
                          readOnly={true}
                          type="text"
                          value={formRenderProps.valueGetter('created_at')}
                          className={'preferencesInput'}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="title">{'Last Modification At'}</td>
                      <td>
                        <input
                          style={{ textAlign: 'center' }}
                          readOnly={true}
                          type="text"
                          value={formRenderProps.valueGetter(
                            'last_modification_at'
                          )}
                          className={'preferencesInput'}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="title">{'Last Modification By'}</td>
                      <td>
                        <input
                          style={{ textAlign: 'center' }}
                          readOnly={true}
                          type="text"
                          value={formRenderProps.valueGetter(
                            'last_modification_by'
                          )}
                          className={'preferencesInput'}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="title">{'Created By'}</td>
                      <td>
                        <input
                          style={{ textAlign: 'center' }}
                          readOnly={true}
                          type="text"
                          value={formRenderProps.valueGetter('user')}
                          className={'preferencesInput'}
                        />
                      </td>
                    </tr>

                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="title">{'Version'}</td>
                      <td>
                        <input
                          style={{ textAlign: 'center' }}
                          readOnly={true}
                          type="text"
                          value={formRenderProps.valueGetter('version')}
                          className={'preferencesInput'}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="titleText">{'Algorithm Overview'}</td>
                      <td>
                        <Field
                          name="algorithm_overview"
                          max={500}
                          value={formRenderProps.valueGetter(
                            'algorithm_overview'
                          )}
                          component={this.FormTextArea}
                          validator={[this.requiredValidator]}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="titleText">{'Model Architecture'}</td>
                      <td>
                        <Field
                          name="model_architecture"
                          max={500}
                          value={formRenderProps.valueGetter(
                            'model_architecture'
                          )}
                          component={this.FormTextArea}
                          validator={[this.requiredValidator]}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="titleText">{'Model Performance'}</td>

                      <td>
                        <Field
                          name="model_performance"
                          max={500}
                          value={formRenderProps.valueGetter(
                            'model_performance'
                          )}
                          component={this.FormTextArea}
                          validator={[this.requiredValidator]}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="titleText">{'Data Description'}</td>

                      <td>
                        <Field
                          name="data_description"
                          max={500}
                          value={formRenderProps.valueGetter(
                            'data_description'
                          )}
                          component={this.FormTextArea}
                          validator={[this.requiredValidator]}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="titleText">{'Input'}</td>

                      <td>
                        <Field
                          name="input"
                          max={500}
                          value={formRenderProps.valueGetter('input')}
                          component={this.FormTextArea}
                          validator={[this.requiredValidator]}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="title">{'Input Modality'}</td>
                      <td>
                        <input
                          style={{ textAlign: 'center' }}
                          readOnly={true}
                          type="text"
                          value={formRenderProps.valueGetter('inputModality')}
                          className={'preferencesInput'}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="titleText">{'References'}</td>

                      <td>
                        <Field
                          name="references"
                          max={500}
                          optional={true}
                          value={formRenderProps.valueGetter('references')}
                          component={this.FormTextArea}
                          validator={[]}
                        />
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td className="titleText">{'Additional Information'}</td>
                      <td>
                        <Field
                          name="additional_info"
                          max={500}
                          optional={true}
                          value={formRenderProps.valueGetter('additional_info')}
                          component={this.FormTextArea}
                          validator={[]}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <TabFooter
                  onResetPreferences={formRenderProps.onFormReset}
                  onSave={formRenderProps.onSubmit}
                  hasErrors={!formRenderProps.allowSubmit}
                  onCancel={this.onClose}
                />
                {this.state.redirect
                  ? this.props.history.push({
                      pathname: '/editor',
                      state: {
                        name: formRenderProps.valueGetter('name'),
                        port: this.state.port,
                        version: formRenderProps.valueGetter('version'),
                        algorithm_overview: formRenderProps.valueGetter(
                          'algorithm_overview'
                        ),
                        model_architecture: formRenderProps.valueGetter(
                          'model_architecture'
                        ),
                        model_performance: formRenderProps.valueGetter(
                          'model_performance'
                        ),
                        data_description: formRenderProps.valueGetter(
                          'data_description'
                        ),
                        input: formRenderProps.valueGetter('input'),
                        output: formRenderProps.valueGetter('output'),
                        references: formRenderProps.valueGetter('references'),
                        additional_info: formRenderProps.valueGetter(
                          'additional_info'
                        ),
                        user: this.props.user.email,
                        task: formRenderProps.valueGetter('task'),
                        visibility: formRenderProps.valueGetter('visibility'),
                        file: this.state.file,
                        inputModality: formRenderProps.valueGetter(
                          'inputModality'
                        ),
                        bodyPart: formRenderProps.valueGetter('bodyPart'),
                      },
                    })
                  : null}
              </form>
            )}
          ></Form>
        </div>
      </>
    );
  }
}

const mapStateToProps = state => ({
  user: state.auth.user,
});

const ConnectedModelContent = connect(
  mapStateToProps,
  null
)(ModelContent);

export default ConnectedModelContent;
