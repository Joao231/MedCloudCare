/* eslint-disable no-console */
import axiosInstance from 'axios';
import { UINotificationService } from '@ohif/core';

const ConnectedAPI = {
  createMyModelEntry: async data => {
    let form_data = new FormData();
    let notification = UINotificationService.create({});

    if (data) {
      form_data.append('name', data.name);
      form_data.append('version', data.version);
      form_data.append('algorithm_overview', data.algorithm_overview);
      form_data.append('model_architecture', data.model_architecture);
      form_data.append('model_performance', data.model_performance);
      form_data.append('data_description', data.data_description);
      form_data.append('input', data.input);
      form_data.append('output', data.output);
      form_data.append('references', data.references);
      form_data.append('additional_info', data.additional_info);
      form_data.append('file', data.file[1], data.file[0] + '.zip');
      form_data.append('user', data.user);
      form_data.append('task', data.task);
      form_data.append('inputExtension', data.inputExtension);
      form_data.append('inputModality', data.inputModality);
      form_data.append('visibility', data.visibility);
      form_data.append('framework', data.framework);
      form_data.append('bodyPart', data.bodyPart);
    }

    const myNewModel = await axiosInstance
      .post(`/api/model/`, form_data, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('access')}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(res => {
        return res;
      })
      .catch(error => {
        return error.response;
      });

    console.log(myNewModel.status);

    if (myNewModel.status === 201) {
      notification.show({
        title: 'Add Algorithm',
        message: 'Algorithm added - Success',
        type: 'success',
        duration: 8000,
      });
    } else if (myNewModel.status === 200) {
      notification.show({
        title: 'Edit Algorithm',
        message: 'Algorithm edited - Success',
        type: 'success',
        duration: 8000,
      });
    } else {
      const error = myNewModel.data['error'];
      notification.show({
        title: 'Add Algorithm',
        message: 'Failed to add algorithm - ' + error,
        type: 'error',
        duration: 10000,
      });

      return myNewModel;
    }
  },
};

export default ConnectedAPI;
