// TODO: cosa restiturire dalle api

const express = require('express');

const router = express.Router();

const Event = require('../../models/event');
const Participant = require('../../models/participant');
const Manager = require('../../models/manager');

const { check } = require('../../lib/authorization');
const checkProperties = require('../../lib/check-properties');
const { diffInYears } = require('../../lib/general');

/**
 * @swagger
 * /v1/events/:
 *   get:
 *     description: Return a list of events
 *     tags:
 *       - events
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
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         allOf:
 *                           - $ref: '#/components/schemas/Event'
 *                           - type: object
 *                             properties:
 *                               manager:
 *                                 type: string
 *                                 format: uuid
 *                                 description: The creator of the event
 *                               participants:
 *                                 type: number
 *                                 description: Number of participants
 *                               address:
 *                                 type: object
 *                                 description: The address of the local.
 *                                 properties:
 *                                   country:
 *                                     type: string
 *                                     description: The country where the local is.
 *                                     example: Italy
 *                                   city:
 *                                     type: string
 *                                     description: The city where the local is.
 *                                     example: Trento
 *                                   street:
 *                                     type: string
 *                                     description: The street where the local is.
 *                                     example: corso tre novembre
 *                                   number:
 *                                     type: integer
 *                                     description: The house number of the local.
 *                                     example: 15
 *                                   cap:
 *                                     type: string
 *                                     description: The cap of the city.
 *                                     example: 38122
 *                               photos:
 *                                 type: array
 *                                 description: Array Id of manager's photos
 *                                 items:
 *                                   type: string
 *                                   format: uuid
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.get('/', async function (_req, res) {
    try {
        const events = (
            await Event.find({ initDate: { $gt: new Date() } }).populate(
                'manager'
            )
        ).map((e) => ({
            ...e._doc,
            manager: e.manager._id,
            address: e.manager.address,
            _v: undefined,
            participantsList: undefined,
            participants: e.participantsList.length,
        }));

        res.status(200).json({
            success: true,
            message: 'Here is the list of events',
            events,
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/events:
 *   post:
 *     summary: A manager creates an event
 *     description: A manager creates an event
 *     tags:
 *       - events
 *     security:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: Id of the created event
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
    check('Manager'),
    checkProperties(['initDate', 'endDate', 'name', 'description']),
    async function (req, res) {
        try {
            const { id } = req.user;
            const manager = await Manager.findById(id);
            // create the event
            const result = await Event.create({
                // requests all the attributes of the body
                ...req.body,
                manager: id,
                photos: manager.photos.map((p) => p._id),
            });
            res.status(200).json({
                success: true,
                eventId: result._id.toString(),
            });
        } catch (e) {
            res.status(501).json({ success: false, message: e.toString() });
        }
    }
);

// TODO: pensare se PUT
/**
 * @swagger
 * /v1/events/{id}/subscribe:
 *   put:
 *     description: A participant subscribes to an event
 *     tags:
 *       - events
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
router.put('/:id/subscribe', check('Participant'), async function (req, res) {
    try {
        const { id } = req.user;
        const user = await Participant.findById(id);
        const event = await Event.findById(req.params.id);
        // check if the participant is already subscribed
        if (event.participantsList.includes(id))
            return res.status(200).json({
                success: false,
                message: 'Participant already subscribed',
            });
        // check if the event is already full
        if (
            event.limitPeople > 0 &&
            event.participantsList.length === event.limitPeople
        )
            return res
                .status(200)
                .json({ success: false, message: 'Event is full' });

        // check if participant is old enough to participate to the event
        if (diffInYears(event.initDate, user.birthDate) < event.ageLimit)
            return res.status(200).json({
                success: false,
                message: 'Too young to subscribe to this event',
            });

        // TODO: if (event.cost != 0), indirizza al pagamento
        // TODO: cambiare save in update

        // subscribe user to event
        event.participantsList.push(id);
        await event.save();

        return res.status(200).json({
            success: true,
            message: 'You are succesfully subscribed to this event',
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/events/{id}/unsubscribe:
 *   put:
 *     description: A participant unsubscribes to an event
 *     tags:
 *       - events
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
router.put('/:id/unsubscribe', check('Participant'), async function (req, res) {
    try {
        const { id } = req.user;
        const event = await Event.findById(req.params.id);

        // check if the participant is already subscribed
        if (event.participantsList.includes(id)) {
            event.participantsList = event.participantsList.filter(
                (_id) => !_id.equals(id)
            );

            await event.save();

            return res.status(200).json({
                success: true,
                message: 'You are succesfully unsubscribed',
            });
        }

        return res.status(200).json({
            success: false,
            message: 'You were not subscribed to this event',
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/events/subscribed:
 *   get:
 *     description: Checking your subscriptions.
 *     tags:
 *       - events
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
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         allOf:
 *                           - $ref: '#/components/schemas/Event'
 *                           - type: object
 *                             properties:
 *                               manager:
 *                                 type: string
 *                                 format: uuid
 *                                 description: The creator of the event
 *                               participants:
 *                                 type: number
 *                                 description: Number of participants
 *                               address:
 *                                 type: object
 *                                 description: The address of the local.
 *                                 properties:
 *                                   country:
 *                                     type: string
 *                                     description: The country where the local is.
 *                                     example: Italy
 *                                   city:
 *                                     type: string
 *                                     description: The city where the local is.
 *                                     example: Trento
 *                                   street:
 *                                     type: string
 *                                     description: The street where the local is.
 *                                     example: corso tre novembre
 *                                   number:
 *                                     type: integer
 *                                     description: The house number of the local.
 *                                     example: 15
 *                                   cap:
 *                                     type: string
 *                                     description: The cap of the city.
 *                                     example: 38122
 *                               photos:
 *                                 type: array
 *                                 description: Array Id of manager's photos
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
router.get('/subscribed', check('Participant'), async function (req, res) {
    try {
        const { id } = req.user;

        const events = (
            await Event.find({
                participantsList: { $all: [id] },
            }).populate('manager')
        ).map((e) => ({
            ...e._doc,
            manager: e.manager._id,
            address: e.manager.address,
            _v: undefined,
            participantsList: undefined,
            participants: e.participantsList.length,
        }));

        return res.status(200).json({
            success: true,
            message: 'Here are your events',
            events,
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});
/**
 * @swagger
 * /v1/events/{id}:
 *   get:
 *     description: Checking your subscriptions.
 *     tags:
 *       - events
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
 *               allOf:
 *                 - $ref: '#/components/schemas/Response'
 *                 - type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         allOf:
 *                           - $ref: '#/components/schemas/Event'
 *                           - type: object
 *                             properties:
 *                               manager:
 *                                 type: string
 *                                 format: uuid
 *                                 description: The creator of the event
 *                               participants:
 *                                 type: number
 *                                 description: Number of participants
 *                               subscribed:
 *                                 type: boolean
 *                                 description: If the participant is subscribed
 *                               address:
 *                                 type: object
 *                                 description: The address of the local.
 *                                 properties:
 *                                   country:
 *                                     type: string
 *                                     description: The country where the local is.
 *                                     example: Italy
 *                                   city:
 *                                     type: string
 *                                     description: The city where the local is.
 *                                     example: Trento
 *                                   street:
 *                                     type: string
 *                                     description: The street where the local is.
 *                                     example: corso tre novembre
 *                                   number:
 *                                     type: integer
 *                                     description: The house number of the local.
 *                                     example: 15
 *                                   cap:
 *                                     type: string
 *                                     description: The cap of the city.
 *                                     example: 38122
 *                               photos:
 *                                 type: array
 *                                 description: Array Id of manager's photos
 *                                 items:
 *                                   type: string
 *                                   format: uuid
 *                               participantsList:
 *                                 type: array
 *                                 description: Id of participants
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
router.get('/:id', check('All'), async function (req, res) {
    try {
        const event = await Event.findById(req.params.id).populate('manager');

        if (event) {
            if (req.user?.type === 'Manager') {
                return res.status(200).json({
                    success: true,
                    message: 'Your event',
                    event: {
                        ...event._doc,
                        manager: event.manager._id,
                        address: event.manager.address,
                        _v: undefined,
                        participants: event.participantsList.length,
                    },
                });
            } else if (req.user?.type === 'Participant') {
                return res.status(200).json({
                    success: true,
                    message: 'The event ' + req.params.id,
                    event: {
                        ...event._doc,
                        manager: event.manager._id,
                        address: event.manager.address,
                        _v: undefined,
                        participantsList: undefined,
                        participants: event.participantsList.length,
                        subscribed: event.participantsList.includes(
                            req.user.id
                        ),
                    },
                });
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'The event ' + req.params.id,
                    event: {
                        ...event._doc,
                        manager: event.manager._id,
                        address: event.manager.address,
                        _v: undefined,
                        participantsList: undefined,
                        participants: event.participantsList.length,
                    },
                });
            }
        } else {
            return res
                .status(200)
                .json({ success: false, message: "The event doesn't exist" });
        }
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

module.exports = router;

/**
 * @swagger
 * /v1/users/{id}:
 *   put:
 *     description: Modify your events
 *     tags:
 *       - events
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
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Request succesfully processed.
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
router.put('/:id', check('Manager'), async function (req, res) {
    try {
        const event = await Event.findById(req.params.id);

        if (event) {
            if (!event.manager.equals(req.user.id)) {
                return res.status(200).json({
                    success: false,
                    message: "You can't modify this event",
                });
            }

            event.name = req.body.name;
            event.initDate = req.body.initDate;
            event.endDate = req.body.endDate;
            event.date = req.body.date;
            event.limitPeople = req.body.limitPeople;
            event.ageLimit = req.body.ageLimit;
            // event.image = req.body.image; TODO
            event.description = req.body.description;
            event.categories = req.body.categories;

            await event.save();

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
});

/**
 * @swagger
 * /v1/users/{id}:
 *   delete:
 *     description: Delete your events
 *     tags:
 *       - events
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
router.delete('/:id', check('Manager'), async function (req, res) {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(200).json({
                success: false,
                message: "The event doesn't exist",
            });
        }
        if (event.manager.equals(req.user.id)) {
            await Event.deleteOne({
                _id: req.params.id,
            });
            return res.status(200).json({
                success: true,
                message: 'Your event has been cancelled',
            });
        } else {
            return res.status(200).json({
                success: false,
                message: "You can't delete this event",
            });
        }
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});
