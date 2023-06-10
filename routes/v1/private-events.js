const express = require('express');

const PrivateEvent = require('../../models/private-event');
const Participant = require('../../models/participant');

const { check } = require('../../lib/authorization');
const { isEmail } = require('../../lib/general');
const checkProperties = require('../../lib/check-properties');

const router = express.Router();

/**
 * @swagger
 * /v1/private-events:
 *   get:
 *     description: checking the events you are subscribed to and the events you created
 *     tags:
 *       - private-events
 *     security:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
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
 *                     myEvents:
 *                       type: array
 *                       description: Events I created
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/PrivateEvent'
 *                           - type: object
 *                             properties:
 *                               creator:
 *                                 type: string
 *                                 format: uuid
 *                                 description: The creator of the event
 *                               participantsList:
 *                                 type: array
 *                                 description: The list of participants
 *                                 items:
 *                                   type: string
 *                                   format: uuid
 *                     events:
 *                       type: array
 *                       description: Events where I'm invited
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/PrivateEvent'
 *                           - type: object
 *                             properties:
 *                               creator:
 *                                 type: string
 *                                 format: uuid
 *                                 description: The creator of the event
 *                               participantsList:
 *                                 type: array
 *                                 description: The list of participants
 *                                 items:
 *                                   type: string
 *                                   format: uuid
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
router.get('/', check('Participant'), async function (req, res) {
    try {
        const { id } = req.user;

        const myEvents = await PrivateEvent.find({ creator: id });
        const events = await PrivateEvent.find({
            participantsList: { $all: [{ user: id }] },
        });

        res.status(200).json({ myEvents, events });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/private-events:
 *   get:
 *     description: The private event can be seen only by his creator or who is invited
 *     tags:
 *       - private-events
 *     security:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
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
 *                     event:
 *                       type: object
 *                       allOf:
 *                         - $ref: '#/components/schemas/PrivateEvent'
 *                         - type: object
 *                           properties:
 *                             creator:
 *                               type: string
 *                               format: uuid
 *                               description: The creator of the event
 *                             participantsList:
 *                               type: array
 *                               description: The list of participants
 *                               items:
 *                                 type: string
 *                                 format: uuid
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
router.get('/:id', check('Participant'), async function (req, res) {
    try {
        const { id } = req.user;

        const event = await PrivateEvent.findById(req.params.id);

        if (
            !event.creator.equals(id) ||
            !event.participantsList.find(({ user }) => user._id.equals(id))
        ) {
            res.status(200).json({
                status: false,
                message: 'You are not allowed to see this event',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Here the event',
            event,
        });
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
 *           $ref: '#/components/schemas/PrivateEvent'
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *         content:
 *           application/json:
 *            schema:
 *              allOf:
 *                - $ref: '#/components/schemas/Response'
 *                - type: object
 *                  properties:
 *                    id:
 *                      type: string
 *                      format: uuid
 *                      description: The event id
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
router.post(
    '/',
    check('Participant'),
    checkProperties(['initDate', 'endDate', 'description']),
    async function (req, res) {
        try {
            const result = await PrivateEvent.create({
                // get all the attributes of the body
                ...req.body,
            });

            res.status(200).json({
                success: true,
                message: 'Event created',
                id: result._id.toString(),
            });
        } catch (e) {
            res.status(501).json({ success: false, message: e.toString() });
        }
    }
);

/**
 * @swagger
 * /v1/private-events/{id}/invite:
 *   put:
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
 *             required: ["users"]
 *             properties:
 *               users:
 *                 type: array
 *                 description: Array of usernames or emails of users
 *                 items:
 *                   type: string
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
 *            schema:
 *               $ref: '#/components/schemas/Response'
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.put(
    '/:id/invite',
    check('Participant'),
    checkProperties(['users']),
    async function (req, res) {
        try {
            const event = await PrivateEvent.findById(req.params.id);

            if (!event.creator.equals(req.user.id)) {
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
    }
);

/**
 * @swagger
 * /v1/private-events/{id}/responde:
 *   put:
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
 *             required: ['accept']
 *             properties:
 *               accept:
 *                 type: boolean
 *                 description: Accept or Deny the invite
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
 *            schema:
 *               $ref: '#/components/schemas/Response'
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.put(
    '/:id/responde',
    check('Participant'),
    checkProperties(['accept']),
    async function (req, res) {
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
    }
);

/**
 * @swagger
 * /v1/private-events/{id}:
 *   put:
 *     description: Modify your private events
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
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrivateEvent'
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
    '/:id',
    check('Participant'),
    checkProperties(['initDate', 'endDate', 'description']),
    async function (req, res) {
        try {
            const event = await PrivateEvent.findById(req.params.id);

            if (event) {
                event.initDate = req.body.initDate;
                event.endDate = req.body.endDate;
                event.address = req.body.address;
                event.price = req.body.price;
                // event.photos = req.body.photos; TODO
                event.description = req.body.description;

                await event.update();

                return res.status(200).json({
                    success: true,
                    message: 'Your changes have been saved',
                });
            } else {
                return res.status(200).json({
                    success: false,
                    message: "The event doesn't exist",
                });
            }
        } catch (e) {
            res.status(501).json({ success: false, message: e.toString() });
        }
    }
);

/**
 * @swagger
 * /v1/private-events/{id}:
 *   delete:
 *     description: Delete your private events
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
 *     responses:
 *       200:
 *         description: Request succesfully processed.
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Response'
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
router.delete('/:id', check('Participant'), async function (req, res) {
    try {
        const event = await PrivateEvent.findById(req.params.id);

        if (!event) {
            return res.status(200).json({
                success: false,
                message: "The event doesn't exist",
            });
        }
        if (event.creator.equals(req.user.id)) {
            await PrivateEvent.deleteOne({
                _id: req.params.id,
            });
            return res.status(200).json({
                success: true,
                message: 'Your has been cancelled',
            });
        } else {
            return res.status(200).json({
                success: false,
                message: "you can't delete this event",
            });
        }
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

module.exports = router;
