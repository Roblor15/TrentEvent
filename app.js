const express = require('express');
const logger = require('morgan');

const indexRouter = require('./routes/v1/index');
const usersRouter = require('./routes/v1/users');

const app = express();

app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
