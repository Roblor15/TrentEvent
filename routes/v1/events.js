const express = require('express');

const router = express.Router();

const Event = require('../../models/event');
const Participant = require('../../models/participant');
const Manager = require('../../models/manager');
const PrivateEvent = require('../../models/private-event');

const check = require('../../lib/authorization');

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
 *                         allOf:
 *                           - $ref: '#/components/schemas/Event'
 *                           - type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                                 description: The id of the event
 *                               manager:
 *                                 type: string
 *                                 format: uuid
 *                                 description: The id of the manager of the event
 *                               photos:
 *                                 type: array
 *                                 description: Photos of the event
 *                                 items:
 *                                   type: string
 *                                   format: binary
 *       400:
 *         description: Malformed request.
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
router.get('/', async function (req, res) {});

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
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Event'
 *               - type: object
 *                 properties:
 *                   photos:
 *                     type: array
 *                     description: Photos of the event
 *                     items:
 *                       type: string
 *                       format: binary
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
router.post('/', check('Manager'), async function (req, res) {
    try {
        const { id } = req.user.id;
        const manager = await Manager.findById(id);
        // create the event
        const result = await Event.create({
            // requests all the attributes of the body
            ...req.body,
            address: manager.address,
            photos: manager.photos,
        });
        res.status(200).json({
            success: true,
            event: {
                date: result.date,
                age_limit: result.age_limit,
                event_cost: result.event_cost,
                person_limit: result.person_limit,
                event_description: result.event_description,
                categories: result.categories,
                event_manager: result.event_manager,
            },
            manager: {
                address: result.address,
                photos: result.photos,
            },
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/users/create-private-event:
 *   post:
 *     description: A participant creates an event
 *     requestBody:
 *     required: true
 *     security:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     content:
 *       multipart/form-data:
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
router.post(
    '/create-private-event',
    check('Participant'),
    async function (req, res) {
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
    }
);

// TODO: pensare se PUT
/**
 * @swagger
 * /v1/events/subscribe/{id}:
 *   post:
 *     summary: A manager creates an event
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
router.post('/subscribe/:id', check('Participant'), async function (req, res) {
    try {
        const { id } = req.user;
        const user = await Participant.findById(id);
        const event = await Event.findById(req.params.id);
        // check if the participant is already subscribed
        if (event.participantsList.find(({ _id }) => _id === id))
            res.status(200).json({
                success: false,
                message: 'Participant already subscribed',
            });
        // check if the event is already full
        if (
            event.limitPeople > 0 &&
            event.participantsList.lenght === event.limitPeople
        )
            return res
                .status(200)
                .json({ success: false, message: 'Event is full' });
        // check if participant is old enough to participate to the event
        if (diffInYears(event.initDate, user.birthDate) < event.ageLimit)
            res.status(200).json({
                success: false,
                message: 'Too young to subscribe to this event',
            });

        // TODO: if (event.cost != 0), indirizza al pagamento

        // subscribe user to event
        event.participantsList.push(id);
        await event.save();

        res.status(200).json({
            success: true,
            message: 'You are succesfully subscribed to this event',
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/event/private-area:
 *   get:
 *     description: Checking your subscriptions.
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
router.get('/private-area/', check('Participant'), async function (req, res) {
    try {
        const participant = await Participant.findOneById(req.user.id);
        const events 
        const result = await Ticket.findOne(req.body);

        if (event.participant_list.includes(participant.id)) {
            if (Ticket.eventid == event.eventid){
            res.status(200).json({
                success: true,
                eventid: result.eventid,
                date: result.date,
                ticketid: result.ticketid,
            });
        
        } else {
            res.status(200).json({
                success: false,
            });
        }
    }
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

function diffInYears(a, b) {
    const now = new Date();

    const years = now.getUTCFullYear() - b.getUTCFullYear();
    const months = now.getUTCMonth() - b.getUTCMonth();
    const days = now.getUTCDate() - b.getUTCDate();

    if (months >= 0 && days >= 0) {
        return years;
    } else {
        return years - 1;
    }
}
