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
    let managerSpy;
    let eventSpy;

    beforeAll(() => {
        const Manager = require('../../models/manager');
        const Event = require('../../models/event');

        managerSpy = jest
            .spyOn(Manager, 'findById')
            .mockImplementation((id) => {
                if (id === 1010)
                    return {
                        address: {
                            country: 'Italy',
                            city: 'Trento',
                            street: 'via Roma',
                            number: '7',
                            cap: '38123',
                        },
                        photos: [{ _id: '09' }, { _id: '088098' }],
                    };
            });

        eventSpy = jest
            .spyOn(Event, 'create')
            .mockImplementation((body) => body);
    });

    afterAll(() => {
        managerSpy.mockRestore();
        eventSpy.mockRestore();
    });
    const validToken = jwt.sign(
        { id: 1010, type: 'Manager' },
        process.env.JWT_SECRET,
        { expiresIn: 86400 }
    );
    test('POST /v1/events created', () => {
        return request(app)
            .post('/v1/events')
            .auth(validToken, { type: 'bearer' })
            .send({
                date: new Date(2023, 11, 2),
                event_description: 'Bar di Trento',
                address: {
                    country: 'Italy',
                    city: 'Trento',
                    street: 'via Roma',
                    number: '7',
                    cap: '38123',
                },
                photos: [{ _id: '09' }, { _id: '088098' }],
            })
            .expect(200) // expected 200 "OK", got 400 "Bad Request"
            .expect(function (res) {
                expect(res.body.success).toBe(true);
            });
    });
});
