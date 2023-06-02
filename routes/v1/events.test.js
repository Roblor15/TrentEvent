const app = require('../../app');

const request = require('supertest');
const jwt = require('jsonwebtoken');

describe('POST /v1/events/{id}/subscribe', () => {
    let eventSpy; // Moking Event.find method
    let participantSpy; // Moking Event.find method

    beforeAll(() => {
        const Event = require('../../models/event');

        eventSpy = jest.spyOn(Event, 'findById').mockImplementation((id) => {
            if (id === '1010')
                return {
                    _id: '1010',
                    participantsList: [250, 251],
                    limitPeople: 500,
                    save: async () => {},
                    initDate: new Date(2022, 11, 1),
                };
            else if (id === '3030')
                return {
                    _id: '3030',
                    participantsList: [250, 251],
                    limitPeople: 500,
                    save: async () => {},
                    initDate: new Date(2023, 11, 1),
                    ageLimit: 18,
                };
            else
                return {
                    _id: id,
                    participantsList: [250, 251, 2010],
                    limitPeople: 3,
                    save: async () => {},
                    initDate: new Date(2023, 11, 1),
                };
        });

        const Participant = require('../../models/participant');

        participantSpy = jest
            .spyOn(Participant, 'findById')
            .mockImplementation((id) => {
                if (id === 3000)
                    return {
                        _id: id,
                        birthDate: new Date(2008, 5, 22),
                    };
                else
                    return {
                        _id: id,
                        birthDate: new Date(2001, 5, 22),
                    };
            });
    });

    afterAll(() => {
        eventSpy.mockRestore();
        participantSpy.mockRestore();
    });

    const validToken = jwt.sign(
        { id: 2010, type: 'Participant' }, // id partecipante
        process.env.JWT_SECRET,
        { expiresIn: 86400 }
    );

    test('POST /v1/events/{id}/subscribe with Participant not already subscribed', () => {
        return request(app)
            .post('/v1/events/1010/subscribe')
            .auth(validToken, { type: 'bearer' })
            .expect(200)
            .expect(function (res) {
                expect(res.body.success).toBe(true);
                expect(res.body.message).toBe(
                    'You are succesfully subscribed to this event'
                );
            });
    });

    test('POST /v1/events/{id}/subscribe with Participant already subscribed', () => {
        return request(app)
            .post('/v1/events/2010/subscribe')
            .auth(validToken, { type: 'bearer' })
            .expect(200)
            .expect(function (res) {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Participant already subscribed');
            });
    });

    const validToken2 = jwt.sign(
        { id: 2020, type: 'Participant' }, // id partecipante
        process.env.JWT_SECRET,
        { expiresIn: 86400 }
    );
    // TODO prima riga id o id=1111, success = false o true
    test('POST /v1/events/1111/subscribe to an event already full', () => {
        return request(app)
            .post('/v1/events/1111/subscribe')
            .auth(validToken2, { type: 'bearer' })
            .expect(200)
            .expect(function (res) {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Event is full');
            });
    });
    const validToken3 = jwt.sign(
        { id: 3000, type: 'Participant' }, // id partecipante
        process.env.JWT_SECRET,
        { expiresIn: 86400 }
    );

    test('POST /v1/events/3030/subscribe to an event with an age limit', () => {
        return request(app)
            .post('/v1/events/3030/subscribe')
            .auth(validToken3, { type: 'bearer' })
            .expect(200)
            .expect(function (res) {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe(
                    'Too young to subscribe to this event'
                );
            });
    });

    const notValidToken = jwt.sign(
        { id: 2010, type: 'Participant' },
        'ciaoooo',
        { expiresIn: 86400 }
    );

    test('POST /v1/events/{id}/subscribe with token not valid', () => {
        return request(app)
            .post('/v1/events/2010/subscribe')
            .auth(notValidToken, { type: 'bearer' })
            .expect(401)
            .expect(function (res) {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Authentication token not valid');
            });
    });

    test('POST /v1/events/{id}/subscribe without token', () => {
        return request(app)
            .post('/v1/events/2010/subscribe')
            .expect(401)
            .expect(function (res) {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Authorization token not found');
            });
    });
});
// TODO expect(res.body.success).toBe(false);
// expect(res.body.message).toBe('');.

describe('POST /v1/events', () => {
    const Manager = require('../../models/manager');
    const Event = require('../../models/event');

    let managerSpy;
    let eventSpy;
    beforeAll(() => {
        const address = {
            country: 'Italia',
            city: 'Trento',
            street: 'via bella',
            number: 1,
            cap: '00000',
        };

        managerSpy = jest
            .spyOn(Manager, 'findById')
            .mockImplementation((id) => {
                return {
                    _id: id,
                    localName: 'Bar Stella',
                    verifiedEmail: true,
                    address,
                    localType: 'Bar',
                    photos: [],
                    approvation: true,
                };
            });
        eventSpy = jest.spyOn(Event, 'create').mockImplementation((params) => ({
            ...params,
            _id: 10000,
        }));
    });

    afterAll(() => {
        managerSpy.mockRestore();
        eventSpy.mockImplementation();
    });

    const validToken = jwt.sign(
        { id: 1010, type: 'Manager' },
        process.env.JWT_SECRET,
        { expiresIn: 86400 }
    );

    test('POST /v1/events create event', () => {
        return request(app)
            .post('/v1/events')
            .send({
                initDate: new Date(2023, 11, 1),
                endDate: new Date(2023, 11, 2),
                name: 'Bar Stella',
                description: 'Bar di Trento',
            })
            .auth(validToken, { type: 'bearer' })
            .expect(200)
            .expect((res) => {
                console.log(res.body);
                expect(res.body.success).toBe(true);
                expect(res.body.eventId).toBe('10000');
            });
    });
});

describe('GET /v1/events', () => {
    const mongoose = require('mongoose');
    const Event = require('../../models/event');
    let db;

    const event = {
        initDate: new Date(2023, 7, 19, 15),
        endDate: new Date(2023, 7, 19, 15, 30),
        categories: 'musica',
        manager: '507f1f77bcf86cd799439011',
    };

    beforeAll(async () => {
        jest.setTimeout(10000);
        mongoose
            .connect(process.env.MONGODB_URL, {
                dbName: 'test',
            })
            .then((d) => (db = d));
    });

    afterAll(async () => {
        await Event.deleteMany();
        await db?.disconnect();
    });

    test('GET /v1/events with also old events', async () => {
        await Event.insertMany(
            [
                event,
                {
                    ...event,
                    initDate: new Date(2022, 9, 4),
                    endDate: new Date(2022, 9, 5),
                },
                {
                    ...event,
                    initDate: new Date(2025, 9, 4),
                    endDate: new Date(2025, 9, 5),
                },
                {
                    ...event,
                    initDate: new Date(2010, 1, 1),
                    endDate: new Date(2010, 1, 15),
                },
                {
                    ...event,
                    initDate: new Date(2021, 11, 31),
                    endDate: new Date(2022, 1, 1),
                },
            ],
            { lean: true }
        );

        return request(app)
            .get('/v1/events')
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(true);
                expect(res.body.message).toBe('Here is the list of events');
                expect(res.body.events).toMatchObject([
                    {
                        initDate: '2023-08-19T13:00:00.000Z',
                        endDate: '2023-08-19T13:30:00.000Z',
                        categories: 'musica',
                        manager: '507f1f77bcf86cd799439011',
                    },
                    {
                        initDate: '2025-10-03T22:00:00.000Z',
                        endDate: '2025-10-04T22:00:00.000Z',
                        categories: 'musica',
                        manager: '507f1f77bcf86cd799439011',
                    },
                ]);
            });
    });
});
