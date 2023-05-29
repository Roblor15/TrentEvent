const app = require('../../app');

const mongoose = require('mongoose');
const request = require('supertest');

const base = '/v1/users/';

describe('POST ' + base + 'signup-manager', () => {
    beforeAll(async () => {
        jest.setTimeout(8000);
        app.locals.db = await mongoose.connect(process.env.DB_URL);
    });
    afterAll(() => {
        mongoose.connection.close(true);
    });

    // test('POST ' + base + 'signup-manager', () => {
    //     return request(app).post(base);
    // });
});
