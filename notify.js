const nodemailer = require('nodemailer');

function sendMail(mailOptions) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASSWORD,
        },
    });

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log('error');
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}
