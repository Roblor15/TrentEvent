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

module.exports = { isEmail, diffInYears };
