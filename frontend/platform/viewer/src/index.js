import 'bootstrap/dist/css/bootstrap.css';
import 'regenerator-runtime/runtime';
import App from './App.js';
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * EXTENSIONS
 * =================
 *
 * Importing and modifying the extensions our app uses HERE allows us to leverage
 * tree shaking and a few other niceties. However, by including them here they become
 * "baked in" to the published application.
 *
 * Depending on your use case/needs, you may want to consider not adding any extensions
 * by default HERE, and instead provide them via the extensions configuration key or
 * by using the exported `App` component, and passing in your extensions as props using
 * the defaultExtensions property.
 */

import OHIFDicomSegmentationExtension from '@ohif/extension-dicom-segmentation';
import OHIFDicomTagBrowserExtension from '@ohif/extension-dicom-tag-browser';
import OHIFMonaiLabelExtension from '@ohif/extension-monai-label';
import { version } from '../package.json';

/*
 * Default Settings
 */
let config = {};

if (window) {
  config = window.config || {};
  window.version = version;
}

const appProps = {
  config,
  defaultExtensions: [
    OHIFDicomSegmentationExtension,
    OHIFDicomTagBrowserExtension,
    OHIFMonaiLabelExtension,
  ],
};

/** Create App */
const app = React.createElement(App, appProps, null);

/** Render */
ReactDOM.render(app, document.getElementById('root'));
