/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
import React, { Fragment, useState } from 'react';
import { Form, Field } from '@progress/kendo-react-form';
import { Input, TextArea } from '@progress/kendo-react-inputs';
import './AddAlgorithm.css';
import types from './types';
import bodyParts from './bodyParts';
import modalities from './modalities';
import { NavLink as Link } from 'react-router-dom';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import axiosInstance from 'axios';
import { ToastContainer, toast } from 'react-toastify';

export const NavBtnLink = styled(Link)`
  cursor: pointer;
  padding: 10px 10px;
  margin-right: 272px;
  margin-left: 10px;
  border-radius: 4px;
  background-color: #646c74;
  color: #fff;
  &:hover {
    transition: all 0.2s ease-in-out;
    background: #000000;
    color: #fff;
  }
`;

const FormTextArea = fieldRenderProps => {
  const { max, value, ...others } = fieldRenderProps;

  return (
    <div className={'k-form-field-wrap'}>
      <TextArea maxLength={max} rows={2} {...others} />
      {value.length} / {max}
    </div>
  );
};

const CustomInput = ({ fieldType, ...others }) => {
  return (
    <div>
      <Input type={fieldType} {...others} />
      <ValidationMessage {...others} />
    </div>
  );
};

const ValidationMessage = ({ valid, visited, validationMessage }) => {
  return (
    <>
      {!valid && visited && <div className="required">{validationMessage}</div>}
    </>
  );
};

const requiredValidator = value => {
  return value ? '' : 'This field is required';
};

function AddAlgorithm({ user }) {
  const [type, setType] = React.useState('');
  const [bodyPart, setBodyPart] = React.useState('');
  const [inputExtension, setInputExtension] = React.useState('');
  const [framework, setFramework] = React.useState('');
  const [inputModality, setInputModality] = React.useState('');
  const [visibility, setVisibility] = React.useState(false);
  const [redirect, setRedirect] = useState(false);

  const handleVisibilityChange = () => {
    if (visibility == false) {
      setVisibility(true);
    } else {
      setVisibility(false);
    }
  };

  const deleteRecord = async algorithm => {
    const response = await axiosInstance
      .get(`/api/model_delete/?algorithm=${algorithm}`, {
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
      setRedirect(true);
    } else {
      toast.error('Failed to overwrite! Please, try again.', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const Msg = ({ closeToast, algorithm }) => (
    <Fragment>
      <div
        style={{
          fontSize: '14px',
          fontFamily: 'Helvetica',
        }}
      >
        An algorithm with the name "{algorithm}" <b>already exists</b>. Do you
        want to <b>overwrite</b> it?
      </div>
      <div>
        <button
          style={{
            fontSize: '14px',
            fontFamily: 'Helvetica',
            display: 'inline-block',
            margin: '7px' /* space between buttons */,
            background: '#FFD700' /* background color */,
            borderRadius: '6px' /* rounded corners */,
            padding: '8px 16px' /* space around text */,
          }}
          onClick={() => deleteRecord(algorithm)}
        >
          Yes
        </button>
        <button
          style={{
            fontSize: '14px',
            fontFamily: 'Helvetica',
            display: 'inline-block',
            margin: '7px' /* space between buttons */,
            background: '#FFD700' /* background color */,
            'border-radius': '6px' /* rounded corners */,
            padding: '8px 16px' /* space around text */,
          }}
          onClick={closeToast}
        >
          No
        </button>
      </div>
    </Fragment>
  );

  const handleSubmit = async formRenderProps => {
    const response = await axiosInstance
      .get(`/api/model/?user=${user.email}`, {
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
    let repeated = false;
    const algorithms = response.data;
    for (let a = 0; a < algorithms.length; a++) {
      if (algorithms[a]['name'] == formRenderProps['name']) {
        let algorithm = algorithms[a]['name'];
        repeated = true;

        toast.warn(<Msg algorithm={algorithm} />, {
          position: 'top-right',
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    }
    if (!repeated) {
      setRedirect(true);
    }
  };

  return (
    <div className="content">
      <Form
        initialValues={{
          description: '',
          overview: '',
          architecture: '',
          performance: '',
          data: '',
          info: '',
          references: '',
          input: '',
          output: '',
        }}
        onSubmit={handleSubmit}
        render={formRenderProps => (
          <form className="formAlgorithm" onSubmit={formRenderProps.onSubmit}>
            <h1>Add Algorithm</h1>
            <label>
              Algorithm Name
              <p className="tooltiptext">
                Unique identifier for the algorithm.
              </p>
              <Field
                className="inputAlgorithm"
                name="name"
                fieldType="text"
                pattern={'[a-z-]+'}
                component={CustomInput}
                validator={[requiredValidator]}
              />
            </label>

            <label>
              Version
              <p className="tooltiptext">Version of the algorithm.</p>
              <Field
                className="inputAlgorithm"
                name="version"
                fieldType="number"
                component={CustomInput}
                validator={[requiredValidator]}
              />
            </label>

            <label>
              Algorithm Overview
              <p className="tooltiptext">Description of the algorithm.</p>
              <Field
                name="overview"
                max={500}
                value={formRenderProps.valueGetter('overview')}
                component={FormTextArea}
                validator={[requiredValidator]}
              />
            </label>
            <label>
              Model Architecture
              <p className="tooltiptext">
                Description of the architecture of the model.
              </p>
              <Field
                name="architecture"
                max={500}
                value={formRenderProps.valueGetter('architecture')}
                component={FormTextArea}
                validator={[requiredValidator]}
              />
            </label>
            <label>
              Model Performance
              <p className="tooltiptext">Performance of the model.</p>
              <Field
                name="performance"
                max={500}
                value={formRenderProps.valueGetter('performance')}
                component={FormTextArea}
                validator={[requiredValidator]}
              />
            </label>
            <label>
              Data Description
              <p className="tooltiptext">Description of the used dataset.</p>
              <Field
                name="data"
                max={500}
                value={formRenderProps.valueGetter('data')}
                component={FormTextArea}
                validator={[requiredValidator]}
              />
            </label>
            <label>
              Input
              <p className="tooltiptext">
                Description of the input of the model.
              </p>
              <Field
                name="input"
                max={500}
                value={formRenderProps.valueGetter('input')}
                component={FormTextArea}
                validator={[requiredValidator]}
              />
            </label>
            <label>
              Output
              <p className="tooltiptext">
                Description of the output of the model.
              </p>
              <Field
                name="output"
                max={500}
                value={formRenderProps.valueGetter('output')}
                component={FormTextArea}
                validator={[requiredValidator]}
              />
            </label>
            <label>
              References <i>(Optional)</i>
              <p className="tooltiptext">Possible references.</p>
              <Field
                name="references"
                max={500}
                optional={'true'}
                value={formRenderProps.valueGetter('references')}
                component={FormTextArea}
                validator={[]}
              />
            </label>
            <label>
              Additional Information <i>(Optional)</i>
              <p className="tooltiptext">Possible extra information.</p>
              <Field
                name="info"
                max={500}
                optional={'true'}
                value={formRenderProps.valueGetter('info')}
                component={FormTextArea}
                validator={[]}
              />
            </label>

            <label>
              Input Extension
              <p className="tooltiptext">
                Extension of the input provided to the algorithm.
              </p>
              <select
                className="selectAlgorithm"
                name="inputExtension"
                value={inputExtension}
                onChange={e => setInputExtension(e.target.value)}
                required
              >
                <option key=""></option>
                {['.dcm', '.nii.gz'].map(extension => (
                  <option key={extension}>{extension}</option>
                ))}
              </select>
            </label>

            <label>
              Input DICOM Modality
              <p className="tooltiptext">The modality of the provided input.</p>
              <select
                className="selectAlgorithm"
                name="inputModality"
                value={inputModality}
                onChange={e => setInputModality(e.target.value)}
                required
              >
                <option key=""></option>
                {modalities.map(modality => (
                  <option key={modality}>{modality}</option>
                ))}
              </select>
            </label>

            <label>
              Task
              <p className="tooltiptext">Task performed.</p>
              <select
                className="selectAlgorithm"
                name="task"
                value={type}
                onChange={e => setType(e.target.value)}
                required
              >
                <option key=""></option>
                {types.map(type => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label>
              Body Part Examined
              <p className="tooltiptext">
                Text description of the part of the body examined.
              </p>
              <select
                className="selectAlgorithm"
                name="bodyPart"
                value={bodyPart}
                onChange={e => setBodyPart(e.target.value)}
                required
              >
                <option key=""></option>
                {Object.keys(bodyParts).map(type => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label>
              Framework
              <p className="tooltiptext">Machine Learning Framework used.</p>
              <select
                className="selectAlgorithm"
                name="framework"
                value={framework}
                onChange={e => setFramework(e.target.value)}
                required
              >
                <option key=""></option>
                {[
                  'Pytorch',
                  'Monai',
                  'Tensorflow',
                  'Keras',
                  'Scikit-Learn',
                  'H20',
                  'Spark',
                  'Other',
                ].map(framework => (
                  <option key={framework}>{framework}</option>
                ))}
              </select>
            </label>

            <label>
              Unrestricted: Public to every user
              <p className="tooltiptext">Visibility of the algorithm.</p>
              <input
                className="inputAlgorithm"
                name="visibility"
                type="checkbox"
                onChange={() => {
                  handleVisibilityChange();
                }}
              />
            </label>

            <div className="btn-group">
              <NavBtnLink to="/">Cancel</NavBtnLink>
              <button disabled={!formRenderProps.allowSubmit}>Create</button>
            </div>
            {redirect ? (
              <Redirect
                to={{
                  pathname: '/editor',
                  state: {
                    name: formRenderProps.valueGetter('name'),
                    version: formRenderProps.valueGetter('version'),
                    algorithm_overview: formRenderProps.valueGetter('overview'),
                    model_architecture: formRenderProps.valueGetter(
                      'architecture'
                    ),
                    model_performance: formRenderProps.valueGetter(
                      'performance'
                    ),
                    data_description: formRenderProps.valueGetter('data'),
                    input: formRenderProps.valueGetter('input'),
                    output: formRenderProps.valueGetter('output'),
                    references: formRenderProps.valueGetter('references'),
                    additional_info: formRenderProps.valueGetter('info'),
                    user: user.email,
                    task: type,
                    inputExtension: inputExtension,
                    inputModality: inputModality,
                    visibility: visibility,
                    framework: framework,
                    bodyPart: bodyPart,
                  },
                }}
              />
            ) : (
              <Fragment></Fragment>
            )}
          </form>
        )}
      ></Form>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

const mapStateToProps = state => ({
  user: state.auth.user,
});

const ConnectedAddAlgorithm = connect(
  mapStateToProps,
  null
)(AddAlgorithm);

export default ConnectedAddAlgorithm;
