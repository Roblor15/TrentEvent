const express = require('express');

const router = express.Router();


const Report = require('../../models/report');

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

/**
 * @swagger
 * /v1/events/:
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
router.get('/', async function (req, res) {
    try {
        const report = await Report.find();

        res.status(200).json({
            success: true,
            message: 'Here are the reports of the events',
            reports:{
                reportText: report.reportText,
                participant: report.participant,
                manager: report.manager,
            },
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});