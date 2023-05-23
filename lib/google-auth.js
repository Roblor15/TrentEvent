const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
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
