const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /signup-manager:
 *   post:
 *     summury: Send a request to register as an Event Manager.
 *     description: Send a request to register as an Event Manager. I will be notify with an email, if your request is accepted or denied.
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
 *                 format: email
 *                 description: The user's email.
 *                 example: mario.rossi@gmail.com
 *               country:
 *                 type: string
 *                 description: The country where the local is.
 *                 example: Italy
 *               city:
 *                 type: string
 *                 description: The city where the local is.
 *                 example: Trento
 *               street:
 *                 type: string
 *                 description: The street where the local is.
 *                 example: corso tre novembre
 *               number:
 *                 type: integer
 *                 description: The house number of the local.
 *                 example: 15
 *               cap:
 *                 type: string
 *                 description: The cap of the city.
 *                 example: 38122
 *               localType:
 *                 type: string
 *                 description: The type of the local.
 *                 example: Bar
 *               localPhotos:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 5
 *                 description: Photos of the local.
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         desctiption: request succesfully processed
 *       400:
 *         desctiption: Malformed request
 */
router.post('/signup-manager', function (req, res) {});

module.exports = router;
