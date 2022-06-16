/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Form } from '@progress/kendo-react-form';
import AceEditor from 'react-ace';
import 'ace-builds/src-min-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/snippets/python';
import 'ace-builds/src-noconflict/theme-dracula';
import './Report.styl';
import { FormElement } from '@progress/kendo-react-form';

class Report extends Component {
  state = {
    report: this.props.report,
  };

  onClose = () => {
    this.props.hide();
  };

  onSubmit = () => {
    //alert(this.state.report);
    this.props.saveReport(
      this.state.report,
      this.props.measurementNumber,
      this.props.isEditingDjango
    );

    this.props.hide();
  };

  onReset = () => {
    this.setState({
      report: this.props.report,
    });
  };

  handleChange = newValue => {
    //console.log(newValue);

    this.setState({
      report: newValue,
    });
  };

  render() {
    return (
      <>
        <div className="ReportContent">
          <Form
            initialValues={{
              report: '',
            }}
            //onSubmit={this.onSubmit}
            render={formRenderProps => (
              <>
                <FormElement
                  style={{
                    width: 575,
                  }}
                  className="formReport"
                  //onSubmit={this.onSubmit}
                >
                  <fieldset className={'k-form-fieldset'}>
                    <AceEditor
                      mode="python"
                      theme="dracula"
                      name="editor"
                      onChange={this.handleChange}
                      value={this.state.report}
                      enableBasicAutocompletion={false}
                      enableLiveAutocompletion={false}
                      enableSnippets={false}
                      fontSize={14}
                      width="150%"
                      height="500px"
                      showPrintMargin={false}
                      highlightActiveLine={true}
                    />
                  </fieldset>
                </FormElement>

                <div className="footer">
                  <div>
                    <div
                      onClick={() => this.onReset()}
                      data-cy="cancel-btn"
                      className="btn btn-default"
                    >
                      Reset to default
                    </div>
                    <button
                      data-cy="cancel-btn"
                      className="btn btn-default"
                      onClick={this.onClose}
                      style={{ marginRight: '5px' }}
                    >
                      Cancel
                    </button>
                  </div>

                  {this.props.isEditingDjango && this.props.canEditStudy ? (
                    <button
                      className="btn btn-primary"
                      data-cy="save-btn"
                      onClick={() => this.onSubmit()}
                    >
                      Ok
                    </button>
                  ) : !this.props.isEditingDjango ? (
                    <button
                      className="btn btn-primary"
                      data-cy="save-btn"
                      onClick={() => this.onSubmit()}
                    >
                      Ok
                    </button>
                  ) : null}
                </div>
              </>
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

const ConnectedReport = connect(
  mapStateToProps,
  null
)(Report);

export default ConnectedReport;
