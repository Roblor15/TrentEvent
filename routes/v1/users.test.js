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
            .field('localType', 'bar')
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
            localName: 'Bello bar',
            email: 'ciao@hotmail.it',
            address,
            localType: 'bar',
        });

        return request(app)
            .post(url)
            .field('localName', 'ciao')
            .field('email', 'ciao@hotmail.it')
            .field('address', JSON.stringify(address))
            .field('localType', 'bar')
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
            .field('localType', 'bar')
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
                        _id: id,
                        verifiedEmail: true,
                        localName: 'ciao',
                        address,
                        localType: 'bar',
                        save: async () => {},
                    };
                if (id === 1001)
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
        return request(app)
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
        return request(app)
            .post(url)
            .send({ ...fakeUser, email: 'ciao@ciao.it' })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Email already used');
            });
    });

    test('POST ' + url + ' participant already with the same email', () => {
        return request(app)
            .post(url)
            .send({ ...fakeUser, email: 'ciaociao@ciao.it' })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Email already used');
            });
    });

    test('POST ' + url + ' participant already with the same username', () => {
        return request(app)
            .post(url)
            .send({ ...fakeUser, username: 'ciaociao', email: 'ciao@ciao.com' })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Username already used');
            });
    });
});

describe('POST ' + base + 'login', () => {
    const url = base + 'login';
    let participantSpy;
    let managerSpy;

    beforeAll(() => {
        participantSpy = jest
            .spyOn(Participant, 'findOne')
            .mockImplementation(({ email, username }) => {
                if (email === 'ciaociao@ciao.it')
                    return {
                        email,
                        verifyPassword: async (pass) => pass === 'test',
                    };
                if (username === 'ciaociao')
                    return {
                        username,
                        verifyPassword: async (pass) => pass === 'test',
                    };
                return;
            });
        managerSpy = jest
            .spyOn(Manager, 'findOne')
            .mockImplementation(({ email }) => {
                if (email === 'ciao@ciao.it')
                    return {
                        email,
                        approvation: { approved: true },
                        verifyPassword: async (pass) => pass === 'test',
                    };
                if (email === 'ciao1@ciao.it')
                    return {
                        email,
                        verifyPassword: async (pass) => pass === 'test',
                    };
                if (email === 'ciao2@ciao.it')
                    return {
                        email,
                        approvation: { approved: false },
                        verifyPassword: async (pass) => pass === 'test',
                    };
                return;
            });
    });

    afterAll(() => {
        participantSpy.mockRestore();
        managerSpy.mockRestore();
    });

    test('POST ' + url + ' participant login with email', () => {
        return request(app)
            .post(url)
            .send({
                credential: 'ciaociao@ciao.it',
                password: 'test',
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(true);
                expect(res.body.message).toBe('Enjoy your token!');
            });
    });

    test('POST ' + url + ' participant login with username', () => {
        return request(app)
            .post(url)
            .send({
                credential: 'ciaociao',
                password: 'test',
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(true);
                expect(res.body.message).toBe('Enjoy your token!');
            });
    });

    test('POST ' + url + ' manager login', () => {
        return request(app)
            .post(url)
            .send({
                credential: 'ciao@ciao.it',
                password: 'test',
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(true);
                expect(res.body.message).toBe('Enjoy your token!');
            });
    });

    test('POST ' + url + ' not signup user', () => {
        return request(app)
            .post(url)
            .send({ credential: 'ciaociaociao', password: 'test' })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('User not found');
            });
    });

    test('POST ' + url + ' with wrong password', () => {
        return request(app)
            .post(url)
            .send({
                credential: 'ciao@ciao.it',
                password: 'wrongTest',
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Wrong password');
            });
    });

    test('POST ' + url + ' manager not already approved', () => {
        return request(app)
            .post(url)
            .send({
                credential: 'ciao1@ciao.it',
                password: 'wrongTest',
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe(
                    "Manager's request is not approved yet"
                );
            });
    });

    test('POST ' + url + ' manager not approved', () => {
        return request(app)
            .post(url)
            .send({
                credential: 'ciao2@ciao.it',
                password: 'wrongTest',
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe(
                    "Manager's request is not approved"
                );
            });
    });
});
