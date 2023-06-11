const express = require('express');

const router = express.Router();

const Report = require('../../models/report');
const Event = require('../../models/event');

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
 *             required: ["eventId", "reportText"]
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *                 description: id of the event
 *               reportText:
 *                 type: string
 *                 description: report text
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
    checkProperties(['eventId', 'reportText']),
    async function (req, res) {
        try {
            const event = await Event.findById(req.body.eventId);
            let result;
            if (event) {
                result = await Report.create({
                    reportText: req.body.reportText,
                    event: req.body.eventId,
                    participant: req.user.id,
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
        const reports = (await Report.find().populate('participant')).map(
            (r) => ({ ...r._doc, participant: r.participant.username })
        );

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
