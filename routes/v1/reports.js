const express = require('express');

const router = express.Router();

const Report = require('../../models/report');

const { check } = require('../../lib/authorization');
const checkProperties = require('../../lib/check-properties');

/**
 * @swagger
 * /v1/reports:
 *   post:
 *     summary: Report an event
 *     description: A participant reports an event
 *     tags:
 *       - reports
 *     security:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["eventId"]
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *                 description: id of the event
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Response'
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
router.post(
    '/',
    check('Participant'),
    checkProperties(['eventId']),
    async function (req, res) {
        try {
            const event = await Event.findById(req.body.eventId);
            let result;
            if (event) {
                result = await Report.create({
                    ...req.body,
                    participant: req.user.id,
                    event: req.user.eventIdd,
                });
                res.status(200).json({
                    success: true,
                    message: 'Report created',
                    participantId: result._id.toString(),
                });
            } else {
                res.status(200).json({
                    success: false,
                    message: 'Event no found',
                });
            }
        } catch (e) {
            res.status(501).json({ success: false, message: e.toString() });
        }
    }
);

/**
 * @swagger
 * /v1/reports/:
 *   get:
 *     description: check reports
 *     tags:
 *       - reports
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 *       401:
 *         description: Not Authorized.
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
router.get('/', check('Supervisor'), async function (req, res) {
    try {
        const reports = await Report.find();

        res.status(200).json({
            success: true,
            message: 'Here are the reports of the events',
            reports,
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

module.exports = router;
