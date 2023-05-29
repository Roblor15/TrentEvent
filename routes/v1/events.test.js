const app = require('../../app');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const assert = require('assert');

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
            else
                return {
                    _id: id,
                    participantsList: [250, 251, 2010],
                    limitPeople: 3,
                    save: async () => {},
                    initDate: new Date(2022, 11, 1),
                };
        });

        const Participant = require('../../models/participant');

        participantSpy = jest
            .spyOn(Participant, 'findById')
            .mockImplementation((id) => {
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
                assert(res.body.success === true);
                assert(
                    res.body.message ===
                        'You are already subscibe to this event'
                );
            });
    });

    test('POST /v1/events/{id}/subscribe with Participant already subscribed', () => {
        return request(app)
            .post('/v1/events/2010/subscribe')
            .auth(validToken, { type: 'bearer' })
            .expect(200)
            .expect(function (res) {
                assert(res.body.success === false);
                assert(res.body.message === 'Participant already subscribe');
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
                assert(res.body.success === false);
                assert(res.body.message === 'Authentication token not valid');
            });
    });

    test('POST /v1/events/{id}/subscribe without token', () => {
        return request(app)
            .post('/v1/events/2010/subscribe')
            .expect(401)
            .expect(function (res) {
                assert(res.body.success === false);
                assert(res.body.message === 'Authentication token not found');
            });
    });
});
