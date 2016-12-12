'use strict';

import { mount } from 'redom';
import { App } from './app';
import { api } from './utils/api';

import actions from './actions';
import data from './data';

const app = new App(data);

mount(document.body, app);

api(app, actions(app));

app.recoverData();
app.startRoute();
