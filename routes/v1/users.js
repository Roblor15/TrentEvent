const express = require('express');
const multer = require('multer');
const { getGoogleAuthLink, verify } = require('../../google-auth');
const jwt = require('jsonwebtoken');

const Manager = require('../../models/managers');
const Participant = require('../../models/participant');
const sendMail = require('../../notify');
const { response } = require('express');

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
 *             type: object
 *             properties:
 *               localName:
 *                 type: string
 *                 description: The local's name.
 *                 example: Bar Bello
 *               email:
 *                 type: string
 *                 description: The user's email.
 *                 example: mario.rossi@gmail.com
 *               address:
 *                 type: object
 *                 description: The address of the local.
 *                 properties:
 *                   country:
 *                     type: string
 *                     description: The country where the local is.
 *                     example: Italy
 *                   city:
 *                     type: string
 *                     description: The city where the local is.
 *                     example: Trento
 *                   street:
 *                     type: string
 *                     description: The street where the local is.
 *                     example: corso tre novembre
 *                   number:
 *                     type: integer
 *                     description: The house number of the local.
 *                     example: 15
 *                   cap:
 *                     type: string
 *                     description: The cap of the city.
 *                     example: 38122
 *               localType:
 *                 type: string
 *                 description: The type of the local.
 *                 example: Bar
 *               photos:
 *                 type: array
 *                 description: Photos of the local.
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *       400:
 *         description: Malformed request.
 *       501:
 *         description: Internal server error.
 */
router.post(
    '/signup-manager',
    upload.array('photos', 5),
    async function (req, res) {
        try {
            // retrieve email and address from body
            const { email, address } = req.body;

            // control if already exists a user with the same email
            const user = await Manager.findOne({ email });
            if (user) return res.status(400).send('Email already used');

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

            res.status(200).json(result);
        } catch (e) {
            res.status(501).send(e.toString());
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
 *       400:
 *         description: Malformed request.
 *       401:
 *         description: Not Authorized.
 *       501:
 *         description: Internal server error.
 */
router.put('/signup-manager', async function (req, res) {
    try {
        // retrieve id and approved from body
        const { id, approved } = req.body;

        // find and update the manager
        const user = await Manager.findById(id);

        // control if exists a user with that id
        if (user?.verifiedEmail) {
            user.approvation = {
                approved,
                when: Date.now(),
            };

            let text;
            if (approved) {
                const newPassword = 'ciao';

                user.password = newPassword;

                text = 'yes';
            } else {
                text = 'no';
            }

            //           await sendMail({
            //               to: user.email,
            //               subject: 'Response',
            //               text,
            //               textEncoding: 'base64',
            //           });

            res.status(200).send('success');
        } else {
            res.status(400).send('id not valid');
        }
    } catch (e) {
        res.status(501).send(e.toString());
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
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *                description: the name of the user
 *                example: Mario
 *              surname:
 *                type: string
 *                description: the surname of the user
 *                example: Rossi
 *              email:
 *                type: string
 *                description: the email of the user
 *                example: Mario.Rossi@gmail.com
 *              password:
 *                type: string
 *                description: the password of the account
 *                example: ciao1234
 *              birthDate:
 *                type: object
 *                description: the birth data of the user
 *                properties:
 *                  year:
 *                    type: integer
 *                    maximum: 2023
 *                  month:
 *                    type: integer
 *                    minimum: 1
 *                    maximum: 12
 *                  day:
 *                    type:
 *                    minimum: 1
 *                    maximum: 31
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *       400:
 *         description: Malformed request.
 *       501:
 *         description: Internal server error.
 */
router.post('/signup-user', async function (req, res) {
    try {
        // retrieve username and email from body
        const { username, email } = req.body;

        // control if already exists a user with the same email or username
        const user = {
            email: await Participant.findOne({ email }),
            username: await Participant.findOne({ username }),
        };
        if (user.email) return res.status(400).send('Email already used');
        if (user.username) return res.status(400).send('Username already used');

        // create a Participant instance with all attributes of body
        const result = await Participant.create({
            ...req.body,
            verifiedEmail: false,
            birthDate: new Date(
                req.body.birthDate.year,
                req.body.birthDate.month - 1,
                req.body.birthDate.day
            ),
        });

        //       await sendMail({
        //           to: user.email,
        //           subject: 'Response',
        //           text: `Gentile ${result.name} ${result.surname}\nLa sua iscrizione è andata a buon fine. Per confermare questa email vada al link http://localhost:3000/v1/users/verify-email/${result._id}`,
        //           textEncoding: 'base64',
        //       });

        // return Participant instance
        res.status(200).json(result);
    } catch (e) {
        res.status(501).send(e.toString());
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
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user.
 *               password:
 *                 type: string
 *                 description: The password off the user.
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *       400:
 *         description: Malformed request.
 *       501:
 *         description: Internal server error.
 */
router.post('/login', async function (req, res) {
    try {
        const user = await Participant.findOne({
            username: req.body.username,
        });
        if (!user)
            return res
                .status(200)
                .json({ success: false, message: 'User not found' });
        if (!(await user.verifyPassword(req.body.password)))
            return res
                .status(200)
                .json({ success: false, message: 'Wrong password' });

        // user authenticated -> create a token
        const payload = {
            email: user.email,
            id: user._id,
        };
        const options = { expiresIn: 86400 }; // expires in 24 hours
        const token = jwt.sign(payload, 'ciao', options);

        res.status(200).json({
            success: true,
            message: 'Enjoy your token!',
            token: token,
            email: user.email,
            id: user._id,
            self: 'api/v1/' + user._id,
        });
    } catch (e) {
        res.status(501).send(e.toString());
    }
});

router.put('/verify-email/:id', async function (req, res) {
    try {
        const user = await Participant.findByIdAndUpdate(req.params.id, {
            verifiedEmail: true,
        });

        if (user) {
            res.json(user);
        } else {
            res.json({});
        }
    } catch (e) {
        res.status(501).send(e.toString());
    }
});

router.get('/google-url', function (_req, res) {
    res.json({ url: getGoogleAuthLink() });
});

router.post('/google-auth', async function (req, res) {
    try {
        const googleUser = await verify(req.body.credential);

        console.log(googleUser);

        if (googleUser === undefined) throw new Error('user not valid');

        let user = await Participant.findOne({ idExteralApi: googleUser.sub });

        if (!user) {
            user = await Participant.create({
                username: 'roblor',
                email: googleUser.email,
                idExteralApi: googleUser.sub,
            });
        }

        // TODO: return token
        res.status(200).send('ok');
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
