const { google } = require('googleapis');
const { oauth2 } = require('googleapis/build/src/apis/oauth2');

const GOOGLE_CLIENT_ID =
    '1057214263816-rr9ai13eu44m3bh957aeos6fbp6ftd59.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/v1/users/google-auth'
);

function getGoogleAuthLink() {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
    });
}

async function verify(token) {
    const ticket = await oauth2Client.verifyIdToken({
        idToken: token,
    });
    const payload = ticket.getPayload();

    return payload;
}

module.exports = { getGoogleAuthLink, verify };
