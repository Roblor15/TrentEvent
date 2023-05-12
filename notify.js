const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'test@js.info',
        pass: 'Node123',
    },
});

const mailOptions = {
    from: 'test@js.info',
    to: 'test1@js.info',
    subject: 'object',
    text: 'testing',
};

transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        console.log('error');
    } else {
        console.log('Email sent: ' + info.response);
    }
});