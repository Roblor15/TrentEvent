const express = require('express');

const router = express.Router();

const Participant = require('../../models/participant');
const Manager = require('../../models/manager');
const Report = require('../../models/report');

const checkProperties = require('../../lib/check-properties');
const { check } = require('../../lib/authorization');

/**
 * @swagger
 * /v1/report:
 *   post:
 *     summary: Report an event
 *     description: A participant reports an event
 *     tags:
 *       - Report
 *     security:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/Report
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
router.post('/report', check('Participant'), async function (req, res) {
    try {
        const event = await Event.findById(req.params.id);
        let result;
        if (event) {
            result = await Report.create({
                ...req.body,
            });
        }
        res.status(200).json({
            success: true,
            participantId: result._id.toString(),
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});
