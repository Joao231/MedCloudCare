/* eslint-disable react/prop-types */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  Form,
  Field,
  FormElement,
  FieldWrapper,
} from '@progress/kendo-react-form';
import { Label, Hint, Error } from '@progress/kendo-react-labels';
import { TextArea } from '@progress/kendo-react-inputs';

const textAreaValidator = value => (!value ? 'Please enter a text.' : '');

class FormTextArea extends React.Component {
  render() {
    const showValidationMessage =
      this.props.touched && this.props.validationMessage;
    const showHint = !showValidationMessage && this.props.hint;
    const hindId = showHint ? `${this.props.id}_hint` : '';
    const errorId = showValidationMessage ? `${this.props.id}_error` : '';
    return (
      <FieldWrapper>
        <Label
          editorId={this.props.id}
          editorValid={this.props.valid}
          editorDisabled={this.props.disabled}
          optional={this.props.optional}
        >
          {this.props.label}
        </Label>
        <div className={'k-form-field-wrap'}>
          <TextArea
            valid={this.props.valid}
            type={this.props.type}
            id={this.props.id}
            disabled={this.props.disabled}
            maxlength={this.props.max}
            rows={3}
            ariaDescribedBy={`${hindId} ${errorId}`}
            {...this.props}
          />
          <span
            className="k-form-hint"
            style={{
              position: 'absolute',
              right: 0,
            }}
          >
            {this.props.value} / {this.props.max}
          </span>
          {showHint && <Hint id={hindId}>{this.props.hint}</Hint>}
          {showValidationMessage && (
            <Error id={errorId}>{this.props.validationMessage}</Error>
          )}
        </div>
      </FieldWrapper>
    );
  }
}

class App extends React.Component {
  render() {
    const max = 200;
    return (
      <Form
        initialValues={{
          sendInvitation: '',
        }}
        onSubmit={this.handleSubmit}
        render={formRenderProps => (
          <FormElement
            style={{
              width: 250,
            }}
          >
            <fieldset
              className={'k-form-fieldset'}
              style={{
                position: 'absolute',
              }}
            >
              <Field
                id={'sendInvitation'}
                name={'sendInvitation'}
                label={'Send Invitation:'}
                max={max}
                value={formRenderProps.valueGetter('sendInvitation').length}
                hint={'Hint: Enter your text here'}
                component={FormTextArea}
                validator={textAreaValidator}
              />
            </fieldset>
          </FormElement>
        )}
      />
    );
  }

  handleSubmit = dataItem => alert(JSON.stringify(dataItem, null, 2));
}

export default App;
