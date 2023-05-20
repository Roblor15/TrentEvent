const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const Manager = require('../../models/managers');
const Participant = require('../../models/participant');
const sendMail = require('../../notify');
const { verify } = require('../../google-auth');

const router = express.Router();

// save files in memory
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /v1/users/signup-manager:
 *   post:
 *     summury: Send a request to register as an Events Manager.
 *     description: Send a request to register as an Event Manager. You will be notify with an email, if your request is accepted or denied.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Manager'
 *               - type: object
 *                 properties:
 *                   photos:
 *                     type: array
 *                     description: Photos of the local.
 *                     items:
 *                       type: string
 *                       format: binary
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Response'
 *                 - type: object
 *                   properties:
 *                     manager:
 *                       $ref: '#/components/schemas/Manager'
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.post(
    '/signup-manager',
    upload.array('photos', 5),
    async function (req, res) {
        try {
            // retrieve email and address from body
            const { email, address } = req.body;

            // control if already exists a manager or a participant with the same email
            let user = await Manager.findOne({ email });
            if (!user) user = await Participant.findOne({ email });

            if (user)
                return res
                    .status(200)
                    .json({ success: false, message: 'Email already used' });

            // create a Manager instance
            const result = await Manager.create({
                // with all attributes of body
                ...req.body,
                // the email is not verified yet
                verifiedEmail: false,
                // convert address from String to Object
                address: JSON.parse(address),
                // retrieve photos sended
                photos: req.files
                    // filter images
                    .filter((p) => p.mimetype.startsWith('image'))
                    .map((p) => ({
                        data: p.buffer,
                        contentType: p.mimetype,
                    })),
            });

            // send email with the link to conferm the email address
            await sendMail({
                to: result.email,
                subject: 'Conferma Email 🚀',
                html: `<p>Ciao ${result.localName},</p>
                   <p>Per confermare questa email clicca <a href="http://localhost:3000/v1/users/verify-email/${result._id}">qui</a>.<br/>
                    Verrai ricontattato con la rispsta di un supervisore.</p>`,
                textEncoding: 'base64',
            });

            // response with main fields of manager
            res.status(200).json({
                success: true,
                message: "Manager's request accepted",
                manager: {
                    localName: result.localName,
                    email: result.email,
                    address: result.address,
                    localType: result.localType,
                },
            });
        } catch (e) {
            res.status(501).json({ success: false, message: e.toString() });
        }
    }
);

/**
 * @swagger
 * /v1/users/signup-manager:
 *   put:
 *     description: Accept or deny the request to become Events Mangager.
 *     security:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["id", "approved"]
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: The id of the request to approve.
 *               approved:
 *                 type: boolean
 *                 description: If the request is approved or not.
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Response'
 *                 - type: object
 *                   properties:
 *                     manager:
 *                       $ref: '#/components/schemas/Manager'
 *       401:
 *         description: Not Authorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.put('/signup-manager', async function (req, res) {
    try {
        // retrieve id and approved from body
        const { id, approved } = req.body;

        // find and update the manager
        const user = await Manager.findById(id);

        // throw an error if user not found
        if (!user) throw new Error('User no found');

        // control if the email address is confermed
        if (user.verifiedEmail) {
            user.approvation = {
                approved,
                when: Date.now(),
            };

            // create body of the email
            let html;
            if (approved) {
                // TODO: random password
                // create a new password for the user
                const newPassword = 'ciao';

                user.password = newPassword;

                html = `<p>Ciao ${user.localName},<br/>
                        La tua richiesta per diventare Organizzatore di eventi è stata accettata.</p>
                        <p>Per accedere al tuo account usa le credenziali:<br/>
                        <b>email</b>: ${user.email}<br/>
                        <b>password</b>: ${newPassword}</p>`;
            } else {
                html = `<p>Ciao ${user.localName},</p>
                        <p>La tua richiesta per diventare Organizzatore di eventi è stata rifiutata.</p>`;
            }

            // send the email
            await sendMail({
                to: user.email,
                subject: 'Richiesta Organizzatore di eventi',
                html,
                textEncoding: 'base64',
            });

            // response with main fields of manager
            res.status(200).json({
                success: true,
                message: "Manager's request updated",
                manager: {
                    localName: user.localName,
                    email: user.email,
                    address: user.address,
                    localType: user.localType,
                },
            });
        } else {
            // response with main fields of manager
            res.status(200).json({
                success: false,
                message: "Manager's email is not confermed",
                manager: {
                    localName: user.localName,
                    email: user.email,
                    address: user.address,
                    localType: user.localType,
                },
            });
        }
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/users/signup-user:
 *   post:
 *     description: Registration for becoming a user
 *     requestBody:
 *      required: true
 *      content:
 *         application/json:
 *          schema:
 *            allOf:
 *              - $ref: '#/components/schemas/Participant'
 *              - type: object
 *                required: ["email","password","birthDate"]
 *                properties:
 *                  password:
 *                    type: string
 *                    description: the password of the account
 *                    example: ciao1234
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Response'
 *                 - type: object
 *                   properties:
 *                     participant:
 *                       $ref: '#/components/schemas/Participant'
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.post('/signup-user', async function (req, res) {
    try {
        // retrieve username and email from body
        const { username, email } = req.body;

        // control if already exists a user with the same email or username
        const user = {
            email:
                (await Participant.findOne({ email })) ||
                (await Manager.findOne({ email })),
            username: await Participant.findOne({ username }),
        };
        if (user.email)
            return res
                .status(200)
                .json({ success: false, message: 'Email already used' });
        if (user.username)
            return res
                .status(200)
                .json({ success: false, message: 'Username already used' });

        // create a Participant instance with all attributes of body
        const result = await Participant.create({
            ...req.body,
            verifiedEmail: false,
            birthDate: new Date(
                req.body.birthDate.year,
                req.body.birthDate.month,
                req.body.birthDate.day
            ),
        });

        // send email
        await sendMail({
            to: result.email,
            subject: 'Conferma Email 🚀',
            html: `<p>Ciao ${result.name} ${result.surname},</p>
                   <p>La tua iscrizione è andata a buon fine. Per confermare questa email clicca <a href="http://localhost:3000/v1/users/verify-email/${result._id}">qui</a></p>`,
            textEncoding: 'base64',
        });

        // response with main fields of participant
        res.status(200).json({
            success: true,
            message: 'User correctly signed up',
            participant: {
                name: result.name,
                surname: result.surname,
                username: result.username,
                email: result.email,
                birthDate: result.birthDate,
            },
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/users/login:
 *   post:
 *     description: Login for the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: ["email", "password"]
 *                 properties:
 *                   email:
 *                     type: string
 *                     description: The email of the user.
 *                   password:
 *                     type: string
 *                     description: The password of the user.
 *               - type: object
 *                 required: ["username", "password"]
 *                 properties:
 *                   username:
 *                     type: string
 *                     description: The username of the user.
 *                   password:
 *                     type: string
 *                     description: The password of the user.
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Response'
 *                 - type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: The token the user has to use in order to desclare his identity.
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.post('/login', async function (req, res) {
    try {
        let user,
            type = 'Participant';

        // if body contains username it has to be a participant
        if (req.body.username) {
            // find the participant
            user = await Participant.findOne({
                username: req.body.username,
            });
        } else {
            // find the participant or the manager
            user = await Participant.findOne({ email: req.body.email });
            if (!user) {
                user = await Manager.findOne({ email: req.body.email });
                // change type to Manager
                type = 'Manager';
            }
        }
        // control if user is found
        if (!user)
            return res
                .status(200)
                .json({ success: false, message: 'User not found' });
        // verify the password
        if (!(await user.verifyPassword(req.body.password)))
            return res
                .status(200)
                .json({ success: false, message: 'Wrong password' });
        // user authenticated -> create a token
        const payload = {
            email: user.email,
            id: user._id,
            type,
        };
        const options = { expiresIn: 86400 }; // expires in 24 hours
        const token = jwt.sign(payload, process.env.JWT_SECRET, options);

        // response with with the token
        res.status(200).json({
            success: true,
            message: 'Enjoy your token!',
            token: token,
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/users/verify-email/{userId}:
 *   get:
 *     description: Verify the email of a user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the user
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.get('/verify-email/:id', async function (req, res) {
    try {
        // find and update the participant or the manager
        const user =
            (await Participant.findByIdAndUpdate(req.params.id, {
                verifiedEmail: true,
            })) ||
            (await Manager.findByIdAndUpdate(req.params.id, {
                verifiedEmail: true,
            }));

        // control if the user is found
        if (user) {
            res.status(200).json({
                success: true,
                message: "User's email verified",
            });
        } else {
            res.status(200).json({
                success: false,
                message: 'User does not exist',
            });
        }
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/users/google-auth:
 *   post:
 *     description: Login or sign up with google account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: The username of the user.
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Response'
 *                 - type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: The token the user has to use in order to desclare his identity.
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.post('/google-auth', async function (req, res) {
    try {
        // verify the token
        const googleUser = await verify(req.body.credential);

        // constrol if token was valid
        if (googleUser === undefined) throw new Error('user not valid');

        // find user in database
        let user = await Participant.findOne({ idExteralApi: googleUser.sub });

        // if not user, create it
        if (!user) {
            user = await Participant.create({
                username: 'roblor',
                email: googleUser.email,
                idExteralApi: googleUser.sub,
            });
        }

        // create token
        const payload = {
            email: user.email,
            id: user._id,
            type: 'Participant',
        };
        const options = { expiresIn: 86400 }; // expires in 24 hours
        const token = jwt.sign(payload, process.env.JWT_SECRET, options);

        // return token
        res.status(200).json({
            success: true,
            message: 'Enjoy your token!',
            token: token,
        });
    } catch (e) {
        res.status(501).send(e.toString());
    }
});

module.exports = router;
/** 
const tokenChecker = function (req, res, next) {
    // header or url parameters or post parameters
    var token =
        req.body.token || req.query.token || req.headers['x-access-token'];
    if (!token)
        res.status(401).json({ success: false, message: 'No token provided.' });
    // decode token, verifies secret and checks expiration
    jwt.verify(token, process.env.SUPER_SECRET, function (err, decoded) {
        if (err)
            res.status(403).json({
                success: false,
                message: 'Token not valid',
            });
        else {
            // if everything is good, save in req object for use in other routes
            req.loggedUser = decoded;
            next();
        }
    });
};
*/

/**
 * @swagger
 * components:
 *   schemas:
 *     Response:
 *       type: object
 *       required: [ "success", "message" ]
 *       properties:
 *         success:
 *           type: boolean
 *           description: If the request was accepted or not.
 *           example: false
 *         message:
 *           type: string
 *           description: An informative message.
 *           example: Error
 *     Participant:
 *       type: object
 *       required: ["name", "surname", "username", "email" , "bithDate"]
 *       properties:
 *         name:
 *           type: string
 *           description: the name of the user
 *           example: Mario
 *         surname:
 *           type: string
 *           description: the surname of the user
 *           example: Rossi
 *         username:
 *           type: string
 *           description: the username of the user
 *           example: mario_rossi18
 *         email:
 *           type: string
 *           description: the email of the user
 *           example: Mario.Rossi@gmail.com
 *         birthDate:
 *           type: object
 *           description: the birth data of the user
 *           properties:
 *             year:
 *               type: integer
 *               maximum: 2023
 *             month:
 *               type: integer
 *               description: January is 0
 *               minimum: 0
 *               maximum: 11
 *             day:
 *               type:
 *               minimum: 1
 *               maximum: 31
 *     Manager:
 *       type: object
 *       required: ["localName", "email", "address", "localType"]
 *       properties:
 *         localName:
 *           type: string
 *           description: The local's name.
 *           example: Bar Bello
 *         email:
 *           type: string
 *           description: The user's email.
 *           example: mario.rossi@gmail.com
 *         address:
 *           type: object
 *           description: The address of the local.
 *           properties:
 *             country:
 *               type: string
 *               description: The country where the local is.
 *               example: Italy
 *             city:
 *               type: string
 *               description: The city where the local is.
 *               example: Trento
 *             street:
 *               type: string
 *               description: The street where the local is.
 *               example: corso tre novembre
 *             number:
 *               type: integer
 *               description: The house number of the local.
 *               example: 15
 *             cap:
 *               type: string
 *               description: The cap of the city.
 *               example: 38122
 *         localType:
 *           type: string
 *           description: The type of the local.
 *           example: Bar
 */
