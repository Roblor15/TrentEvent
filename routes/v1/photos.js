const express = require('express');

const Photo = require('../../models/photo');

const router = express.Router();

/**
 * @swagger
 * /v1/photos/{id}:
 *   get:
 *     description: Receive the specified photo
 *     tags:
 *       - photos
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Response'
 *                 - type: string
 *                   format: buffer
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.get('/:id', async function (req, res) {
    try {
        const photo = await Photo.findById(req.params.id);

        if (photo) {
            res.status(200).send(photo.data);
        } else {
            res.status(200).json({ success: false, message: 'Phot not found' });
        }
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

module.exports = router;
