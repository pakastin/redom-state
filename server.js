'use strict';

const path = require('path');
const express = require('express');
const compression = require('compression');

const app = express();

app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

app.listen(8080, () => {
  console.log('Server running at: http://localhost:8080');
  console.log('========================================');
});
