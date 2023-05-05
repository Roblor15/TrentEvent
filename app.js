const express = require('express');
const logger = require('morgan');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const indexRouter = require('./routes/v1/index');
const usersRouter = require('./routes/v1/users');

const swaggerOptionsV1 = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TrentEvent',
            version: '0.0.1',
        },
    },
    apis: ['./routes/v1/*.js'],
};

const swaggerDocument = swaggerJsDoc(swaggerOptionsV1);

const app = express();

app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api-docs/v1', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.use('/v1', indexRouter);
app.use('/v1/users', usersRouter);

module.exports = app;
