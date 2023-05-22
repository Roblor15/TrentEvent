/**import * as queryString from 'query-string';

const stringifiedParams = queryString.stringify({
  client_id: process.env.APP_ID_GOES_HERE,
  redirect_uri: 'https://www.example.com/authenticate/facebook/',
  scope: ['email', 'user_friends'].join(','), // comma seperated string
  response_type: 'code',
  auth_type: 'rerequest',
  display: 'popup',
});

const facebookLoginUrl = `https://www.facebook.com/v4.0/dialog/oauth?${stringifiedParams}`;

import * as queryString from 'query-string';

const urlParams = queryString.parse(window.location.search);

console.log(`The code is: ${urlParams.code}`);
Frontend

*/

async function getAccessTokenFromCode(code) {
    const { data } = await fetch(
        `https://graph.facebook.com/v4.0/oauth/access_token?client_id=${
            process.env.APP_ID_GOES_HERE
        }&client_secret=${
            process.env.APP_SECRET_GOES_HERE
        }&redirect_uri=${''}&code=${code}`
    );
    console.log(data); // { access_token, token_type, expires_in }
    return data.access_token;
}

async function getFacebookUserData(access_token) {
    const { data } = await fetch(
        `https://graph.facebook.com/v4.0/oauth/access_token?fields=${[
            'id',
            'email',
            'first_name',
            'last_name',
        ].join(',')}&access_token=${access_token}`
    );
    console.log(data); // { id, email, first_name, last_name }
    return data;
}
