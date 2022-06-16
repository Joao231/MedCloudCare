/* eslint-disable no-console */
import axios from 'axios';

export default class Client {
  constructor() {
    this.server_url = new URL('http://localhost/'); //http://localhost/(nome do modelo)/
  }

  async info() {
    let url = new URL(`/api/model/`, this.server_url);

    return await Client.api_get(url.toString());
  }

  async segmentation(model, image, params = {}, label = null) {
    console.log(params);
    return this.infer(model, image, params, label, 'arraybuffer');
  }

  async classification(model, image, params = {}, label = null) {
    return this.infer(model, image, params, label, 'json');
  }

  async registration(model, image, params = {}, label = null) {
    return this.infer(model, image, params, label, 'arraybuffer');
  }

  async infer(
    model,
    image,
    params,
    label = null,
    responseType,
    result_extension = '.nrrd'
  ) {
    //http://localhost/(nome do modelo)/container_api/infer
    let port = params['port'];
    let url = new URL(
      `ml/${model}/${port}/` + // api
      encodeURIComponent(model) +
        '/' +
        encodeURIComponent(image),
      `http://localhost/` // this.server_url
    );

    url = url.toString();

    console.log(url);

    if (result_extension) {
      params.result_extension = result_extension;
      params.result_dtype = 'uint16';
      params.result_compress = false;
    }

    return await Client.api_post(url, params, label, true, responseType);
  }

  async save_label(image, label, params) {
    let url = new URL(`/api/label/`, this.server_url);
    url.searchParams.append('image', image);
    url = url.toString();

    const data = Client.constructFormDataFromArray(
      params,
      label,
      'label',
      'label.bin'
    );

    return await Client.api_put_data(url, data, 'json');
  }

  static constructFormDataFromArray(params, data, name, fileName) {
    let formData = new FormData();
    formData.append('params', JSON.stringify(params));
    formData.append(name, data, fileName);
    return formData;
  }

  static constructFormData(params, files) {
    let formData = new FormData();
    formData.append('params', JSON.stringify(params));

    if (files) {
      if (!Array.isArray(files)) {
        files = [files];
      }
      for (let i = 0; i < files.length; i++) {
        formData.append(files[i].name, files[i].data, files[i].fileName);
      }
    }
    return formData;
  }

  static constructFormOrJsonData(params, files) {
    return files ? Client.constructFormData(params, files) : params;
  }

  static api_get(url) {
    const config = {
      headers: {
        Authorization: `JWT ${localStorage.getItem('access')}`,
      },
    };
    return axios
      .get(url, config)
      .then(function(response) {
        return response;
      })
      .catch(function(error) {
        return error;
      })
      .finally(function() {});
  }

  static api_delete(url) {
    console.debug('DELETE:: ' + url);
    return axios
      .delete(url)
      .then(function(response) {
        console.debug(response);
        return response;
      })
      .catch(function(error) {
        return error;
      })
      .finally(function() {});
  }

  static api_post(
    url,
    params,
    files,
    form = true,
    responseType = 'arraybuffer'
  ) {
    const data = form
      ? Client.constructFormData(params, files)
      : Client.constructFormOrJsonData(params, files);

    return Client.api_post_data(url, data, responseType);
  }

  static api_post_data(url, data, responseType) {
    console.debug('POST:: ' + url);

    return axios
      .post(url, data, {
        responseType: responseType,
        headers: {
          Authorization: `JWT ${localStorage.getItem('access')}`,
          accept: ['application/json', 'multipart/form-data'],
        },
      })
      .then(function(response) {
        console.debug(response);
        return response;
      })
      .catch(function(error) {
        return error;
      })
      .finally(function() {});
  }

  static api_put(url, params, files, form = false, responseType = 'json') {
    const data = form
      ? Client.constructFormData(params, files)
      : Client.constructFormOrJsonData(params, files);
    return Client.api_put_data(url, data, responseType);
  }

  static api_put_data(url, data, responseType = 'json') {
    console.debug('PUT:: ' + url);
    return axios
      .put(url, data, {
        responseType: responseType,
        headers: {
          accept: ['application/json', 'multipart/form-data'],
          Authorization: `JWT ${localStorage.getItem('access')}`,
        },
      })
      .then(function(response) {
        console.debug(response);
        return response;
      })
      .catch(function(error) {
        return error;
      });
  }
}
