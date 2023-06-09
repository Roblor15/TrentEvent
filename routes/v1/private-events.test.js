const app = require('../../app');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const Participant = require('../../models/participant');
const PrivateEvent = require('../../models/private-event');

// describe('POST /v1/private-events', () => {
//     let participantSpy; // Moking Event.find method

//     beforeAll(() => {
//         participantSpy = jest
//             .spyOn(Participant, 'findById')
//             .mockImplementation((id) => {
//                 return {
//                     _id: id,
//                     birthDate: new Date(2001, 1, 1),
//                 };
//             });
//     });

//     afterAll(() => {
//         participantSpy.mockRestore();
//     });

//     const validToken = jwt.sign(
//         { id: 1000, type: 'Participant' }, // id partecipante
//         process.env.JWT_SECRET,
//         { expiresIn: 86400 }
//     );

//     test('POST /v1/private-events/', () => {
//         return request(app)
//             .post('/v1/private-events/')
//             .auth(validToken, { type: 'bearer' })
//             .send({
//                 address: JSON.stringify({
//                     country: 'Italy',
//                     city: 'Trento',
//                     street: 'via Manci',
//                     number: 5,
//                     cap: '38123',
//                     description: 'ciao',
//                     price: 5,
//                 }),
//                 initDate: new Date(2024, 1, 1),
//                 endDate: new Date(2024, 1, 2),
//                 price: 5,
//                 description: 'ciao',
//                 photos: [],
//                 creator: 1000,
//                 participantList: [],
//             })
//             .expect(200)
//             .expect(function (res) {
//                 expect(res.success).toBe(true);
//             });
//     });

//     // da modificare per far andare il filter delle foto
//     test('POST /v1/private-events/1010/create event without initdate', () => {
//         return request(app)
//             .post('/v1/private-events')
//             .auth(validToken, { type: 'bearer' })
//             .send({
//                 address: JSON.stringify({
//                     country: 'Italy',
//                     city: 'Trento',
//                     street: 'via Manci',
//                     number: 5,
//                     cap: '38123',
//                     description: 'ciao',
//                     price: 5,
//                 }),
//                 endDate: new Date(2024, 1, 2),
//                 price: 5,
//                 description: 'ciao',
//                 photos: [],
//                 creator: 1000,
//                 participantList: [],
//             })
//             .expect(501)
//             .expect(function (res) {
//                 expect(res.body.success).toBe(false);
//                 expect(res.body.message).toBe('Error: Date required');
//             });
//     });

//     test('POST /v1/private-events/2020/create event with wrong initdate', () => {
//         return request(app)
//             .post('/v1/private-events')
//             .auth(validToken, { type: 'bearer' })
//             .send({
//                 address: JSON.stringify({
//                     country: 'Italy',
//                     city: 'Trento',
//                     street: 'via Manci',
//                     number: 5,
//                     cap: '38123',
//                     description: 'ciao',
//                     price: 5,
//                 }),
//                 initDate: new Date(2021, 1, 1),
//                 endDate: new Date(2024, 1, 2),
//                 price: 5,
//                 description: 'ciao',
//                 photos: [],
//                 creator: 1000,
//                 participantList: [],
//             })
//             .expect(501)
//             .expect(function (res) {
//                 expect(res.body.success).toBe(false);
//                 expect(res.body.message).toBe('Error: The initDate is old');
//             });
//     });

//     test('POST /v1/private-events/3030/create event with initDate bigger than endDate', () => {
//         return request(app)
//             .post('/v1/private-events')
//             .auth(validToken, { type: 'bearer' })
//             .send({
//                 address: JSON.stringify({
//                     country: 'Italy',
//                     city: 'Trento',
//                     street: 'via Manci',
//                     number: 5,
//                     cap: '38123',
//                     description: 'ciao',
//                     price: 5,
//                 }),
//                 initDate: new Date(2024, 1, 2),
//                 endDate: new Date(2024, 1, 1),
//                 price: 5,
//                 description: 'ciao',
//                 photos: [],
//                 creator: 1000,
//                 participantList: [],
//             })
//             .expect(501)
//             .expect(function (res) {
//                 expect(res.body.success).toBe(false);
//                 expect(res.body.message).toBe(
//                     "Error: You can't end an event before it started"
//                 );
//             });
//     });
// });

// describe('PUT /v1/private-events/{id}/invite', () => {
//     let eventSpy; // Moking Event.find method
//     let participantSpy; // Moking Event.find method

//     beforeAll(() => {
//         participantSpy = jest
//             .spyOn(Participant, 'findById')
//             .mockImplementation((id) => {
//                 return {
//                     _id: id,
//                     email: 'ciao@gmail.com',
//                 };
//             });

//         eventSpy = jest
//             .spyOn(PrivateEvent, 'findById')
//             .mockImplementation((id) => {
//                 return {
//                     _id: id,
//                     save: async () => {},
//                     creator: 1000,
//                 };
//             });
//     });

//     afterAll(() => {
//         eventSpy.mockRestore();
//         participantSpy.mockRestore();
//     });

//     const validToken = jwt.sign(
//         { id: 1000, type: 'Participant' }, // id partecipante
//         process.env.JWT_SECRET,
//         { expiresIn: 86400 }
//     );
//     const validToken2 = jwt.sign(
//         { id: 2000, type: 'Participant' }, // id partecipante
//         process.env.JWT_SECRET,
//         { expiresIn: 86400 }
//     );

//     test('PUT /v1/private-events/{id}/invite participants to your event', () => {
//         return request(app)
//             .put('/v1/private-events/1010/invite')
//             .auth(validToken, { type: 'bearer' })
//             .expect(200)
//             .expect(function (res) {
//                 expect(res.body.success).toBe(true);
//                 expect(res.body.message).toBe(
//                     'Your invitations have been sent'
//                 );
//             });
//     });

//     test('PUT /v1/private-events/{id}/invite participants to an event that is not yours', () => {
//         return request(app)
//             .put('/v1/private-events/2020/invite')
//             .auth(validToken2, { type: 'bearer' })
//             .expect(200)
//             .expect(function (res) {
//                 expect(res.body.success).toBe(false);
//                 expect(res.body.message).toBe(
//                     'You are not the owner of the event'
//                 );
//             });
//     });
// });

describe('PUT /v1/private-events/{id}/responde', () => {
    let eventSpy; // Moking Event.find method

    beforeAll(() => {
        eventSpy = jest
            .spyOn(PrivateEvent, 'findById')
            .mockImplementation((id) => {
                if (id === 1010)
                    return {
                        _id: 1010,
                        participantsList: [{ user: 3000 }],
                    };
                else if (id === 2020)
                    return {
                        _id: 2020,
                        participantsList: [
                            { user: 1000 },
                            { user: 2000 },
                            { user: 3000 },
                        ],
                    };
            });
    });

    afterAll(() => {
        eventSpy.mockRestore();
    });

    const validToken = jwt.sign(
        { id: 1000, type: 'Participant' },
        process.env.JWT_SECRET,
        { expiresIn: 86400 }
    );

    test('PUT /v1/private-events/{id}/responde to an invitation', () => {
        return request(app)
            .put('/v1/private-events/2020/responde')
            .auth(validToken, { type: 'bearer' })
            .expect(function (res) {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Your response is saved');
            });
    });

    test('PUT /v1/private-events/{id}/responde to an event where you are not invited', () => {
        return request(app)
            .put('/v1/private-events/1010/responde')
            .auth(validToken, { type: 'bearer' })
            .expect(function (res) {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('You have not been invited');
            });
    });
});
