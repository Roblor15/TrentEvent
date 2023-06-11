const { isEmail, diffInYears } = require('./general');

describe('isEmail function', () => {
    test('Right email', () => {
        expect(isEmail('ciao.ciao@ciao.it')).toBe(true);
    });

    test('Email without at', () => {
        expect(isEmail('ciao.ciaociao.it')).toBe(false);
    });

    test('Email without final part', () => {
        expect(isEmail('ciao.ciao@ciao')).toBe(false);
    });
});

describe('diffInYears function', () => {
    test('With only different years', () => {
        expect(diffInYears(new Date(2015, 0), new Date(2013, 0))).toBe(2);
    });

    test('With different years and months', () => {
        expect(diffInYears(new Date(2015, 1), new Date(2013, 2))).toBe(1);
        expect(diffInYears(new Date(2015, 1), new Date(2013, 0))).toBe(2);
    });

    test('With different years and days', () => {
        expect(diffInYears(new Date(2015, 1, 2), new Date(2013, 1, 3))).toBe(1);
        expect(diffInYears(new Date(2015, 1, 2), new Date(2013, 1, 1))).toBe(2);
    });
});
