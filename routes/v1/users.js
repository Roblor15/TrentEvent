const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const Manager = require('../../models/manager');
const Participant = require('../../models/participant');
const sendMail = require('../../lib/notify');
const { verify } = require('../../lib/facebook-auth');
const checkProperties = require('../../lib/check-properties');
const { check } = require('../../lib/authorization');
const { generatePassword, isEmail } = require('../../lib/general');

const router = express.Router();

// save files in memory
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /v1/users/signup-manager:
 *   post:
 *     summury: Send a request to register as an Events Manager.
 *     description: Send a request to register as an Event Manager. You will be notify with an email, if your request is accepted or denied.
 *     tags:
 *       - users
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
 *                   sendEmail:
 *                     type: boolean
 *                     description: Decide if the system sends an email for conferming it
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
 *       400:
 *         description: Malformed request.
 *         content:
 *           application/json:
 *            schema:
 *               $ref: '#/components/schemas/Response'
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
    checkProperties(['localName', 'email', 'address', 'localType']),
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
            if (req.body.sendEmail === 'true') {
                sendMail({
                    to: result.email,
                    subject: 'Conferma Email 🚀',
                    html: `<p>Ciao ${result.localName},</p>
                   <p>Per confermare questa email clicca <a href="http://localhost:3000/v1/users/verify-email/${result._id}">qui</a>.<br/>
                    Verrai ricontattato con la rispsta di un supervisore.</p>`,
                    textEncoding: 'base64',
                }).catch((e) => console.log(e));
            }

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
 *     tags:
 *       - users
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
 *               sendEmail:
 *                 type: boolean
 *                 description: Decide if send an email
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
 *       400:
 *         description: Malformed request.
 *         content:
 *           application/json:
 *            schema:
 *               $ref: '#/components/schemas/Response'
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
router.put(
    '/signup-manager',
    checkProperties(['id', 'approved']),
    async function (req, res) {
        try {
            // retrieve id and approved from body
            const { id, approved } = req.body;

            // find and update the manager
            const user = await Manager.findById(id);

            // throw an error if user not found
            if (!user) throw new Error('User not found');

            // control if the email address is confermed
            if (user.verifiedEmail) {
                user.approvation = {
                    approved,
                    when: Date.now(),
                };

                // create body of the email
                let html;
                if (approved) {
                    // create a new password for the user
                    const newPassword = generatePassword(12);

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

                if (req.body.sendEmail === 'true') {
                    // send the email
                    await sendMail({
                        to: user.email,
                        subject: 'Richiesta Organizzatore di eventi',
                        html,
                        textEncoding: 'base64',
                    });
                }

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
    }
);

/**
 * @swagger
 * /v1/users/signup-user:
 *   post:
 *     description: Registration for becoming a user
 *     tags:
 *       - users
 *     requestBody:
 *      required: true
 *      content:
 *         application/json:
 *          schema:
 *            allOf:
 *              - $ref: '#/components/schemas/Participant'
 *              - type: object
 *                required: ["password"]
 *                properties:
 *                  password:
 *                    type: string
 *                    description: the password of the account
 *                    example: ciao1234
 *                  sendEmail:
 *                    type: boolean
 *                    description: decide if send email for confermation
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
 *       400:
 *         description: Malformed request.
 *         content:
 *           application/json:
 *            schema:
 *               $ref: '#/components/schemas/Response'
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.post(
    '/signup-user',
    checkProperties([
        'name',
        'surname',
        'username',
        'email',
        'birthDate',
        'password',
    ]),
    async function (req, res) {
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
                birthDate: new Date(
                    req.body.birthDate.year,
                    req.body.birthDate.month - 1,
                    req.body.birthDate.day
                ),
                verifiedEmail: false,
            });

            if (req.body.sendEmail === true) {
                // send email
                sendMail({
                    to: result.email,
                    subject: 'Conferma Email 🚀',
                    html: `<p>Ciao ${result.name} ${result.surname},</p>
                   <p>La tua iscrizione è andata a buon fine. Per confermare questa email clicca <a href="http://localhost:3000/v1/users/verify-email/${result._id}">qui</a></p>`,
                    textEncoding: 'base64',
                }).catch(console.log);
            }

            // response with main fields of participant
            res.status(200).json({
                success: true,
                message: 'User correctly signed up',
                id: result._id,
            });
        } catch (e) {
            res.status(501).json({ success: false, message: e.toString() });
        }
    }
);

/**
 * @swagger
 * /v1/users/login:
 *   post:
 *     description: Login for the user.
 *     tags:
 *       - users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["credential", "password"]
 *             properties:
 *               credential:
 *                 type: string
 *                 description: The email or the username of the user.
 *               password:
 *                 type: string
 *                 description: The password of the user.
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
 *       400:
 *         description: Malformed request.
 *         content:
 *           application/json:
 *            schema:
 *               $ref: '#/components/schemas/Response'
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.post(
    '/login',
    checkProperties(['credential', 'password']),
    async function (req, res) {
        try {
            let user,
                type = 'Participant';

            // if body contains username it has to be a participant
            if (!isEmail(req.body.credential)) {
                // find the participant
                user = await Participant.findOne({
                    username: req.body.credential,
                });
            } else {
                // find the participant or the manager
                user = await Participant.findOne({
                    email: req.body.credential,
                });

                if (!user) {
                    user = await Manager.findOne({
                        email: req.body.credential,
                    });

                    // control if manager was approved
                    if (user.approvation === undefined)
                        return res.status(200).json({
                            success: false,
                            message: "Manager's request is not approved yet",
                        });
                    if (user.approvation.approved === false)
                        return res.status(200).json({
                            success: false,
                            message: "Manager's request is not approved",
                        });

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
    }
);

/**
 * @swagger
 * /v1/users/verify-email/{userId}:
 *   get:
 *     description: Verify the email of a user.
 *     tags:
 *       - users
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
 *     tags:
 *       - users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["credential"]
 *             properties:
 *               credential:
 *                 type: string
 *                 description: The google token.
 *               username:
 *                 type: string
 *                 description: The username of the user (if it is the first time)
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
 *       400:
 *         description: Malformed request.
 *         content:
 *           application/json:
 *            schema:
 *               $ref: '#/components/schemas/Response'
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.post(
    '/google-auth',
    checkProperties(['credential']),
    async function (req, res) {
        try {
            // verify the token
            const googleUser = await verify(req.body.credential);

            // controls if token was valid
            if (googleUser === undefined) throw new Error('user not valid');

            // find user in database
            let user = await Participant.findOne({
                idExteralApi: googleUser.sub,
            });

            // if not user, create it
            if (!user) {
                user = await Participant.create({
                    username: req.body.username,
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
            res.status(501).json({ success: false, message: e.toString() });
        }
    }
);

/**
 * @swagger
 * /v1/users/password:
 *   put:
 *     description: Change the password of the account.
 *     tags:
 *       - users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["password"]
 *             properties:
 *               password:
 *                 type: string
 *                 description: The google token.
 *
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 *       400:
 *         description: Malformed request.
 *         content:
 *           application/json:
 *            schema:
 *               $ref: '#/components/schemas/Response'
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
router.put(
    '/password',
    check('Participant'),
    checkProperties(['password']),
    async function (req, res) {
        try {
            // find user in database
            const user = await Participant.findById(req.user.id);
            user.password = req.body.password;

            //save the user updates
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Password changed',
            });
        } catch (e) {
            res.status(501).json({ success: false, message: e.toString() });
        }
    }
);

router.get('/managers/:id', async function (req, res) {
    try {
        const manager = await Manager.findbyId(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Manager infos',
            infos: {
                localName: manager.localName,
                email: manager.email,
                address: manager.address,
                localType: manager.localType,
                photos: manager.photos,
            },
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

router.get('/manager', check('Manager'), async function (req, res) {
    try {
        const manager = await Manager.findById(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Your infos',
            infos: {
                localName: manager.localName,
                email: manager.email,
                verifiedEmail: manager.verifiedEmail,
                address: manager.address,
                localType: manager.localType,
                photos: manager.photos,
                approvation: manager.approvation,
            },
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

router.get('/valid-token', function (req, res) {
    let token;
    const authHeader = req.headers['authorization'];

    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7, authHeader.length);
    } else {
        return res
            .status(400)
            .json({ success: false, message: 'Authorization token not found' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.id && decoded.type) {
            res.status(200).json({
                success: true,
                message: 'Your token is valid',
            });
        } else {
            res.status(200).json({
                success: false,
                message: 'Your token is not valid',
            });
        }
    } catch (e) {
        res.status(200).json({
            success: false,
            message: 'Your token is not valid',
        });
    }
});

module.exports = router;
