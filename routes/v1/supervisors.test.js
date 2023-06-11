const app = require('../../app');

const request = require('supertest');
const jwt = require('jsonwebtoken');

const Manager = require('../../models/manager');

const base = '/v1/supervisors/';

describe('PUT ' + base + 'manager-approvation', () => {
    const url = base + 'manager-approvation';

    let managerSpy;
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
                if (id === '1000')
                    return {
                        _id: id,
                        verifiedEmail: true,
                        localName: 'ciao',
                        address,
                        localType: 'bar',
                        save: async () => {},
                    };
                if (id === '1001')
                    return {
                        _id: id,
                        verifiedEmail: false,
                        localName: 'ciao',
                        address,
                        localType: 'bar',
                        save: async () => {},
                    };
            });
    });

    afterAll(() => {
        managerSpy.mockRestore();
    });

    const validToken = jwt.sign(
        { id: 3000, type: 'Supervisor' }, // id partecipante
        process.env.JWT_SECRET,
        { expiresIn: 86400 }
    );

    test('PUT ' + url + ' right request', () => {
        return request(app)
            .put(url + '/1000')
            .send({ approved: true })
            .auth(validToken, { type: 'bearer' })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(true);
                expect(res.body.message).toBe("Manager's request updated");
            });
    });

    test('PUT ' + url + ' user does not exist', () => {
        return request(app)
            .put(url + '/1100')
            .send({ approved: true })
            .auth(validToken, { type: 'bearer' })
            .expect(501)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Error: User not found');
            });
    });

    test('PUT ' + url + " user's email not verified", () => {
        return request(app)
            .put(url + '/1001')
            .send({ approved: true })
            .auth(validToken, { type: 'bearer' })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe(
                    "Manager's email is not confermed"
                );
            });
    });
});
