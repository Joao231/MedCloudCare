import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Form, Field } from '@progress/kendo-react-form';

import { TextArea } from '@progress/kendo-react-inputs';

class ModelContentNoEdit extends Component {
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
    };
  }

  static propTypes = {
    user: PropTypes.object,
    info: PropTypes.array,
    onClose: PropTypes.func,
    history: PropTypes.object,
  };

  onClose = () => {
    this.props.onClose();
  };

  FormTextArea = fieldRenderProps => {
    const { max, value, ...others } = fieldRenderProps;

    return (
      <div className={'k-form-field-wrap'}>
        <TextArea
          readOnly={true}
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
              port: this.state.port,
              algorithm_overview: this.state.algorithm_overview,
              model_architecture: this.state.model_architecture,
              model_performance: this.state.model_performance,
              data_description: this.state.data_description,
              input: this.state.input,
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
            render={formRenderProps => (
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
                    <td className="title">{'Port'}</td>
                    <td>
                      <input
                        style={{ textAlign: 'center' }}
                        readOnly={true}
                        type="text"
                        value={formRenderProps.valueGetter('port')}
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
                      />
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: 'transparent' }}>
                    <td className="titleText">{'Model Performance'}</td>

                    <td>
                      <Field
                        name="model_performance"
                        max={500}
                        value={formRenderProps.valueGetter('model_performance')}
                        component={this.FormTextArea}
                      />
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: 'transparent' }}>
                    <td className="titleText">{'Data Description'}</td>

                    <td>
                      <Field
                        name="data_description"
                        max={500}
                        value={formRenderProps.valueGetter('data_description')}
                        component={this.FormTextArea}
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
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
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

const ConnectedModelContentNoEdit = connect(
  mapStateToProps,
  null
)(ModelContentNoEdit);

export default ConnectedModelContentNoEdit;
