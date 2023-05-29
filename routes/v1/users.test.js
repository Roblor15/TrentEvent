const app = require('../../app');

const mongoose = require('mongoose');
const request = require('supertest');

const base = '/v1/users/';

describe('POST ' + base + 'signup-manager', () => {
    let db;

    beforeAll(async () => {
        jest.setTimeout(10000);
        db = await mongoose.connect(process.env.MONGODB_URL);
    });
    afterAll(async () => {
        await db?.disconnect();
    });

    test('POST ' + base + 'signup-manager', () => {
        return request(app)
            .post(base + 'signup-manager')
            .send({})
            .expect(400);
    });
});
