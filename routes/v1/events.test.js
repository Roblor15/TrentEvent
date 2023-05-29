const request = require('supertest');
const app = require('../../app');
const jwt = require('jsonwebtoken');

describe('POST /v1/events/subscribe/{id}', () => {
    let eventSpy; // Moking Event.find method
    let participantSpy; // Moking Event.find method
    let saveSpy;

    beforeAll(() => {
        const Event = require('../../models/event');
        eventSpy = jest.spyOn(Event, 'findById').mockImplementation((id) => {
            if (id === 1010)
                return {
                    _id: 1010,
                    participantList: [250, 251],
                    limitPeople: 500,
                };
            else
                return {
                    _id: id,
                    participantList: [250, 251, 2010],
                    limitPeople: 3,
                };
        });
        const Participant = require('../../models/participant');
        participantSpy = jest
            .spyOn(Participant, 'findById')
            .mockImplementation((id) => {
                return { _id: 2010, birthDate: new Date(2001, 5, 22) };
            });
        saveSpy = jest.spyOn(Participant, 'save').mockImplementation(() => {
            return;
        });
        afterAll(async () => {
            eventSpy.mockRestore();
            participantSpy.mockRestore();
            saveSpy.mockRestore();
        });
        const token = jwt.sign(
            { id: 2010, type: 'Participant' }, // id partecipante
            'ciao',
            { expiresIn: 86400 }
        );

        test('POST /v1/events/subscribe/{id} with Participant not already subscribed', () => {
            return request(app)
                .post('/v1/events/1010/subscribe')
                .set('authorization', 'Bearer ' + token)
                .expect(200);
        });
    });
});
