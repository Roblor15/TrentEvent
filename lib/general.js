const crypto = require('crypto');

function isEmail(string) {
    return /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/.test(string);
}

function diffInYears(a, b) {
    const aa = new Date(a);
    const bb = new Date(b);

    const years = aa.getUTCFullYear() - bb.getUTCFullYear();
    const months = aa.getUTCMonth() - bb.getUTCMonth();
    const days = aa.getUTCDate() - bb.getUTCDate();

    if (months > 0 || (months == 0 && days >= 0)) {
        return years;
    } else {
        return years - 1;
    }
}

// Function that create a random password
const generatePassword = (
    length = 20,
    wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$'
) =>
    Array.from(crypto.randomFillSync(new Uint32Array(length)))
        .map((x) => wishlist[x % wishlist.length])
        .join('');

module.exports = { isEmail, diffInYears, generatePassword };
