const app = require('../../app');

const mongoose = require('mongoose');
const request = require('supertest');

const Manager = require('../../models/manager');
const Participant = require('../../models/participant');

const base = '/v1/users/';

describe('POST ' + base + 'signup-manager', () => {
    const url = base + 'signup-manager';
    let db;

    beforeAll(async () => {
        jest.setTimeout(10000);
        db = mongoose
            .connect(process.env.MONGODB_URL, {
                dbName: 'test',
            })
            .then((b) => (db = b));
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
                expect(res.body.success).toBe(true);
            });
    });

    test('POST ' + url + ' with email already registered', async () => {
        const address = {
            country: 'Italia',
            city: 'Trento',
            street: 'via bella',
            number: 1,
            cap: '00000',
        };

        await Manager.create({
            localName: 'Bello Bar',
            email: 'ciao@hotmail.it',
            address,
            localType: 'Bar',
        });

        return request(app)
            .post(url)
            .field('localName', 'ciao')
            .field('email', 'ciao@hotmail.it')
            .field('address', JSON.stringify(address))
            .field('localType', 'Bar')
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message === 'Email already used');
            });
    });

    test('POST ' + url + ' with email not valid', () => {
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
            .field('email', 'ciao@.ie')
            .field('address', JSON.stringify(address))
            .field('localType', 'Bar')
            .expect(501)
            .expect((res) => {
                expect(res.body.success).toBe(false);
            });
    });
});

describe('PUT ' + base + 'signup-manager', () => {
    const url = base + 'signup-manager';

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
                if (id === 1000)
                    return {
                        verifiedEmail: true,
                        localName: 'ciao',
                        address,
                        localType: 'Bar',
                    };
                if (id === 1001)
                    return {
                        verifiedEmail: false,
                        localName: 'ciao',
                        address,
                        localType: 'Bar',
                    };
            });
    });

    afterAll(() => {
        managerSpy.mockRestore();
    });

    test('PUT ' + url + ' right request', () => {
        return request(app)
            .put(url)
            .send({ id: 1000, approved: true })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(true);
                expect(res.body.message).toBe("Manager's request updated");
            });
    });

    test('PUT ' + url + ' user does not exist', () => {
        return request(app)
            .put(url)
            .send({ id: 1100, approved: true })
            .expect(501)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Error: User not found');
            });
    });

    test('PUT ' + url + " user's email not verified", () => {
        return request(app)
            .put(url)
            .send({ id: 1001, approved: true })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe(
                    "Manager's email is not confermed"
                );
            });
    });
});

describe('POST ' + base + 'signup-user', () => {
    const url = base + 'signup-user';
    let participantSpyFind;
    let participantSpyCreate;
    let managerSpy;

    const fakeUser = {
        name: 'ciao',
        surname: 'ciao',
        username: 'ciao',
        birthDate: { year: 1, month: 1, day: 1 },
        password: 'ciao',
    };

    beforeAll(() => {
        participantSpyFind = jest
            .spyOn(Participant, 'findOne')
            .mockImplementation(({ email, username }) => {
                if (email === 'ciaociao@ciao.it') return { email };
                if (username === 'ciaociao') return { username };
                return;
            });
        participantSpyCreate = jest
            .spyOn(Participant, 'create')
            .mockImplementation((params) => ({
                ...params,
                _id: '1000',
            }));
        managerSpy = jest
            .spyOn(Manager, 'findOne')
            .mockImplementation(({ email }) => {
                if (email === 'ciao@ciao.it') return { email };
                return;
            });
    });

    afterAll(() => {
        participantSpyFind.mockRestore();
        participantSpyCreate.mockRestore();
        managerSpy.mockRestore();
    });

    test('POST ' + url + ' right request', () => {
        request(app)
            .post(url)
            .send({
                ...fakeUser,
                email: 'ciao@ciao.com',
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(true);
                expect(res.body.message).toBe('User correctly signed up');
                expect(res.body.id).toBe('1000');
            });
    });

    test('POST ' + url + ' manager already with the same email', () => {
        request(app)
            .post(url)
            .send({ ...fakeUser, email: 'ciao@ciao.it' })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Email already used');
            });
    });

    test('POST ' + url + ' participant already with the same email', () => {
        request(app)
            .post(url)
            .send({ ...fakeUser, email: 'ciaociao@ciao.it' })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Email already used');
            });
    });

    test('POST ' + url + ' participant already with the same username', () => {
        request(app)
            .post(url)
            .send({ ...fakeUser, username: 'ciaociao' })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Username already used');
            });
    });
});
