const crypto = require('crypto');

function isEmail(string) {
    return /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/.test(string);
}

function diffInYears(a, b) {
    const now = new Date();

    const years = now.getUTCFullYear() - b.getUTCFullYear();
    const months = now.getUTCMonth() - b.getUTCMonth();
    const days = now.getUTCDate() - b.getUTCDate();

    if (months >= 0 && days >= 0) {
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
