const express = require('express');
const logger = require('morgan');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const mongoose = require('mongoose');
const cors = require('cors');

// retrieve environments variables from .env file
require('dotenv').config();

const usersRouter = require('./routes/v1/users');
const eventRouter = require('./routes/v1/events');
const privateEventRouter = require('./routes/v1/private-events');

// options for the openapi documentation
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

// create s swagger document from the JsDocs
const swaggerDocument = swaggerJsDoc(swaggerOptionsV1);

// connect to database
mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => console.log('Connected to mongodb'));

// create express app
const app = express();

// use looger for debug infos
app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// serve api documentation on /api-docs/v1
app.use('/api-docs/v1', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// serve apis for users
app.use('/v1/users', usersRouter);
// serve apis for events
app.use('/v1/events', eventRouter);
// serve apis for private-events
app.use('/v1/private-events', privateEventRouter);

module.exports = app;
