const app = require('../../app');

const mongoose = require('mongoose');
const request = require('supertest');
const assert = require('assert');

const Manager = require('../../models/manager');

const base = '/v1/users/';

describe('POST ' + base + 'signup-manager', () => {
    const url = base + 'signup-manager';
    let db;

    beforeAll(async () => {
        jest.setTimeout(10000);
        db = await mongoose.connect(process.env.MONGODB_URL, {
            dbName: 'test',
        });
    });
    afterAll(async () => {
        await db?.disconnect();
    });
    afterEach(async () => {
        await Manager.deleteMany();
    });

    test('POST ' + base + 'signup-manager with malformed request', () => {
        return request(app)
            .post(base + 'signup-manager')
            .expect(400);
    });

    test('POST ' + url + ' right request', () => {
        const address = {
            country: 'Italia',
            city: 'Trento',
            street: 'via bella',
            number: 1,
            cap: '00000',
        };
        return request(app)
            .post(url)
            .field('localName', 'ciao')
            .field('email', 'ciao@c.ie')
            .field('address', JSON.stringify(address))
            .field('localType', 'Bar')
            .expect(200)
            .expect((res) => {
                assert(res.body.success === true);
            });
    });

    test('POST ' + url + ' with email already registered', async () => {
        await Manager.create({
            localName: 'Bello Bar',
            email: 'ciao@hotmail.it',
            address: {
                country: 'Italia',
                city: 'Trento',
                street: 'via bella',
                number: 1,
                cap: '00000',
            },
            localType: 'Bar',
        });

        return request(app)
            .post(url)
            .send({
                localName: 'Bar Bello',
                email: 'ciao@hotmail.it',
                address: {
                    country: 'Italia',
                    city: 'Castel Ivano',
                    street: 'Via dei Caboeri',
                    number: 1,
                    cap: '38059',
                },
                localType: 'Bar',
            })
            .expect(200)
            .expect((res) => {
                assert(res.body.success === false);
                assert(res.body.message === 'Email already used');
            });
    });
});
