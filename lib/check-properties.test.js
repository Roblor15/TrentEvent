const jwt = require('jsonwebtoken');
const express = require('express');
const request = require('supertest');

const checkProperties = require('./check-properties');

describe('Check properties middleware', () => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.post('/participant', checkProperties(['ciao']), (_req, res) => {
        res.status(200).send('ciao');
    });

    test('Right body request', () => {
        return request(app)
            .post('/participant')
            .send({ ciao: '', c: '' })
            .expect(200);
    });

    test('Without required property', () => {
        return request(app).post('/participant').send({ c: '' }).expect(400);
    });
});
