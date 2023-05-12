const express = require('express');
const multer = require('multer');

const Manager = require('../../models/managers');

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
            res.status(501).send(e);
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
        const user = await Manager.findByIdAndUpdate(id, {
            approvation: { approved, when: Date.now() },
        });

        // control if exists a user with that id
        if (user) {
            res.status(200).send('success');
        } else {
            res.status(400).send('id not valid');
        }
    } catch (e) {
        res.status(501).send(e);
    }
});

/**
 * @swagger
 * /v1/users/login:
 *   put:
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
router.post('');

module.exports = router;
