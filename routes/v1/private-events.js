const express = require('express');

const PrivateEvent = require('../../models/private-event');
const Participant = require('../../models/participant');

const { check } = require('../../lib/authorization');
const { isEmail } = require('../../lib/general');

const router = express.Router();

router.get('/', check('Participant'), async function (req, res) {
    try {
        const { id } = req.user;

        const myEvents = await PrivateEvent.find({ creator: id });
        const events = await PrivateEvent.find({
            participantsList: { $all: [id] },
        });

        res.status(200).json({ myEvents, events });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

router.get('/:id', check('Participant'), async function (req, res) {
    try {
        const { id } = req.user;

        const event = await PrivateEvent.findById(req.params.id);

        if (
            event.creator !== id ||
            !event.participantsList.find(({ user }) => user._id === id)
        ) {
            res.status(200).json({
                status: false,
                message: 'You are not allowed to see this event',
            });
        }

        res.status(200).json({ success: true, message: '', event });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/private-events:
 *   post:
 *     description: A participant creates an event
 *     requestBody:
 *     required: true
 *     security:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     tags:
 *       - private-events
 *     content:
 *       application/json:
 *         schema:
 *           allOf:
 *             - $ref: '#/components/schemas/PrivateEvent'
 *             - type: object
 *               properties:
 *                 photos:
 *                   type: array
 *                   description: Photos of the local.
 *                   items:
 *                     type: string
 *                     format: binary
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *         content:
 *           application/json:
 *            schema:
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
 *            schema:
 *               $ref: '#/components/schemas/Response'
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *            schema:
 *               $ref: '#/components/schemas/Response'
 */
router.post('/', check('Participant'), async function (req, res) {
    try {
        const { address } = req.body;
        const result = await PrivateEvent.create({
            // requests all the attributes of the body
            ...req.body,
            address: JSON.parse(address),
            photos: req.files
                // filter images
                .filter((p) => p.mimetype.startsWith('image'))
                .map((p) => ({
                    data: p.buffer,
                    contentType: p.mimetype,
                })),
        });
        res.status(200).json({
            date: result.date,
            address: result.address,
            cost: result.event_cost,
            description: result.event_description,
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/private-events/{id}/invite:
 *   post:
 *     description: Invites user to private event
 *     tags:
 *       - private-events
 *     security:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Id of the event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: string
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
router.put('/:id/invite', check('Participant'), async function (req, res) {
    try {
        const event = await PrivateEvent.findById(req.params.id);

        if (event.creator !== req.user.id) {
            return res.status(200).json({
                success: false,
                message: 'You are not the owner of the event',
            });
        }

        for (const user of req.body.invites) {
            let u;
            if (isEmail(user)) {
                u = await Participant.findOne({
                    email: user.email,
                });
            } else {
                u = await Participant.findOne({
                    username: user.username,
                });
            }

            event.participantsList.push({ user: u._id, state: 'Pending' });
        }

        await event.save();

        res.status(200).json({
            success: true,
            message: 'Your invitations have been sent',
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/private-events/{id}/responde:
 *   post:
 *     description: Accept or deny an invitation to a private event
 *     tags:
 *       - private-events
 *     security:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Id of the event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accept: boolean
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
router.put('/:id/responde', check('Participant'), async function (req, res) {
    try {
        const event = await PrivateEvent.findById(req.params.id);
        const invitation = event.participantsList.findIndex(
            ({ user }) => user.user === req.user.id
        );

        if (invitation > 0) {
            if (req.body.accept) {
                event.participantsList[invitation].state = 'Accepted';
            } else {
                event.participantsList[invitation].state = 'Denied';
            }

            return res
                .status(200)
                .json({ success: true, message: 'Your response is saved' });
        } else {
            res.status(200).json({
                success: false,
                message: 'You have not been invited',
            });
        }
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

module.exports = router;