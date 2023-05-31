const app = require('../../app');

const request = require('supertest');
const jwt = require('jsonwebtoken');

describe('POST /v1/private-events', () => {
    let eventSpy; // Moking Event.find method
    let participantSpy; // Moking Event.find method

    beforeAll(() => {
        const PrivateEvent = require('../../models/private-event');

        eventSpy = jest
            .spyOn(PrivateEvent, 'create')
            .mockImplementation((id) => {
                if (id === '1010')
                    return {
                        _id: '1010',
                        endDate: new Date(2024, 1, 1),
                        address: {
                            country: 'Italy',
                            city: 'Trento',
                            street: 'via Manci',
                            number: '1',
                            cap: '38049',
                        },
                        description: 'ciao',
                        price: 5,
                    };
                else if (id === '2020')
                    return {
                        _id: '2020',
                        initDate: new Date(2021, 1, 1),
                        endDate: new Date(2024, 1, 1),
                        address: {
                            country: 'Italy',
                            city: 'Trento',
                            street: 'via Manci',
                            number: '1',
                            cap: '38049',
                        },
                        description: 'ciao',
                        price: 5,
                    };
                else if (id === '3030')
                    return {
                        _id: '3030',
                        initDate: new Date(2025, 1, 1),
                        endDate: new Date(2024, 1, 1),
                        address: {
                            country: 'Italy',
                            city: 'Trento',
                            street: 'via Manci',
                            number: '1',
                            cap: '38049',
                        },
                        description: 'ciao',
                        price: 5,
                    };
                else
                    return {
                        _id: id,
                        initDate: new Date(2024, 1, 1),
                        endDate: new Date(2024, 1, 2),
                        address: {
                            country: 'Italy',
                            city: 'Trento',
                            street: 'via Manci',
                            number: '1',
                            cap: '38049',
                        },
                        description: 'ciao',
                        price: 5,
                    };
            });

        const Participant = require('../../models/participant');

        participantSpy = jest
            .spyOn(Participant, 'findById')
            .mockImplementation((id) => {
                if (id === '3000')
                    return {
                        _id: id,
                        birthDate: new Date(2001, 1, 1),
                    };
            });
    });

    afterAll(() => {
        eventSpy.mockRestore();
        participantSpy.mockRestore();
    });

    const validToken = jwt.sign(
        { id: 3000, type: 'Participant' }, // id partecipante
        process.env.JWT_SECRET,
        { expiresIn: 86400 }
    );

    test('POST /v1/private-events/{id}/create event', () => {
        return request(app)
            .post('/v1/private-events/')
            .auth(validToken, { type: 'bearer' })
            .expect(200)
            .expect(function (res) {
                expect(res.body).toBe({
                    initDate: eventSpy.initDate,
                    endDate: eventSpy.endDate,
                    address: eventSpy.address,
                    price: eventSpy.price,
                    description: eventSpy.description,
                });
            });
    });

    test('POST /v1/private-events/1010/create event without initdate', () => {
        return request(app)
            .post('/v1/private-events')
            .auth(validToken, { type: 'bearer' })
            .expect(200)
            .expect(function (res) {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('start date of the event needed');
            });
    });

    test('POST /v1/private-events/2020/create event with wrong initdate', () => {
        return request(app)
            .post('/v1/private-events')
            .auth(validToken, { type: 'bearer' })
            .expect(200)
            .expect(function (res) {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('start date of the event is old');
            });
    });

    test('POST /v1/private-events/3030/create event with initDate bigger than endDate', () => {
        return request(app)
            .post('/v1/private-events')
            .auth(validToken, { type: 'bearer' })
            .expect(200)
            .expect(function (res) {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('initDate bigger than endDate');
            });
    });
});
