var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var registryRouter = require('./routes/registry');
var digestRouter = require('./routes/digest');

var app = express();

app.use(logger('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', registryRouter);
app.use('/digests', digestRouter);

module.exports = app;
