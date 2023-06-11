const jwt = require('jsonwebtoken');
const express = require('express');
const request = require('supertest');

const { check } = require('./authorization');

describe('Authorization and authentication middleware', () => {
    const app = express();

    app.get('/participant', check('Participant'), (_req, res) => {
        res.status(200).send('ciao');
    });

    const notValidToken = jwt.sign(
        { id: 2010, type: 'Participant' },
        'ciaoooo',
        {
            expiresIn: 86400,
        }
    );

    const validToken = jwt.sign(
        { id: 2010, type: 'Participant' },
        process.env.JWT_SECRET,
        { expiresIn: 86400 }
    );

    const validTokenManager = jwt.sign(
        { id: 2010, type: 'Manager' },
        process.env.JWT_SECRET,
        { expiresIn: 86400 }
    );

    test('Valid token with right type', () => {
        return request(app)
            .get('/participant')
            .auth(validToken, { type: 'bearer' })
            .expect(200);
    });

    test('Not valid token wth right type', () => {
        return request(app)
            .get('/participant')
            .auth(notValidToken, { type: 'bearer' })
            .expect(401)
            .expect(function (res) {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Authorization token not valid');
            });
    });

    test('Valid token with wrong type', () => {
        return request(app)
            .get('/participant')
            .auth(validTokenManager, { type: 'bearer' })
            .expect(403)
            .expect(function (res) {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('You are not authorized');
            });
    });

    test('Without token', () => {
        return request(app)
            .get('/participant')
            .expect(401)
            .expect(function (res) {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Authorization token not found');
            });
    });
});
