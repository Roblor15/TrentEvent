const express = require('express');

const router = express.Router();
const Event = require('../../models/event'); 
const check = require('../../lib/authorization');
const Participant = require('../../models/participant');
const Manager = require('../../models/manager');
const Private_event = require('../../models/private-event');

/**
 * @swagger
 * /v1/events/:
 *   get:
 *     description: Return a list of events
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: The id of the event
 *                   data:
 *                     type: object
 *                     description: The data of the event
 *                     properties:
 *                       year:
 *                         type: integer
 *                       month:
 *                         type: integer
 *                         minimum: 1
 *                         maximum: 12
 *                       day:
 *                         type: integer
 *                         minimum: 1
 *                         maximum: 31
 *                   startHour:
 *                     type: object
 *                     description: The Start hour of the event
 *                     properties:
 *                       hour:
 *                         type: integer
 *                         minimum: 0
 *                         maximum: 23
 *                       minutes:
 *                         type: integer
 *                         minimum: 0
 *                         maximum: 59
 *                   endHour:
 *                     type: object
 *                     description: The End hour of the event
 *                     properties:
 *                       hour:
 *                         type: integer
 *                         minimum: 0
 *                         maximum: 23
 *                       minutes:
 *                         type: integer
 *                         minimum: 0
 *                         maximum: 59
 *                   name:
 *                     type: string
 *                     description: The name of the event
 *                   address:
 *                     type: object
 *                     description: The address of the local.
 *                     properties:
 *                       country:
 *                         type: string
 *                         description: The country where the local is.
 *                         example: Italy
 *                       city:
 *                         type: string
 *                         description: The city where the local is.
 *                         example: Trento
 *                       street:
 *                         type: string
 *                         description: The street where the local is.
 *                         example: corso tre novembre
 *                       number:
 *                         type: integer
 *                         description: The house number of the local.
 *                         example: 15
 *                       cap:
 *                         type: string
 *                         description: The cap of the city.
 *                         example: 38122
 *                   manager:
 *                     type:string
 *                     description: The name of the event's manager
 *                   ageLimit:
 *                     type: integer
 *                     minimum: 0
 *                     description: The minimum age to access the event
 *                   limit_people:
 *                     type: integer
 *                     description: The limit number of people that can participate to the event
 *                   price:
 *                     type: float
 *                     description: The price of the event (zero for a free event)
 *                     example: 12,50
 *                   eventDescription:
 *                     type:string
 *                     description: The description and explanation of the event
 *                   category:
 *                     type: string
 *                     description: The category of the event (1 or more categories)
 *                   photos:
 *                     type: array
 *                     description: Photos of the event
 *                     items:
 *                       type: string
 *                       format: binary
 *         description: Request succesfully processed.
 *       400:
 *         description: Malformed request.
 *       401:
 *         description: Not Authorized.
 *       501:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /v1/users/create-events:
 *  post:
 *      summary: A manager creates an event
 *      description: A manager creates an event and the participant can subsribe to it
 *      requestBody:
 *          required: true
 *          content:
 *              multipart/form-data:
 *                  schema:
 *                      type: object
 *                      required: [data, startHour, endHour, name, address, manager, eventDescription, category]
 *                      properties:
 *                          data:
 *                              type: object
 *                              description: The data of the event
 *                              properties:
 *                                  year:
 *                                      type: integer
 *                                  month:
 *                                      type: integer
 *                                      minimum: 1
 *                                      maximum: 12
 *                                  day:
 *                                      type: integer
 *                                      minimum: 1
 *                                      maximum: 31
 *                          startHour:
 *                              type: object
 *                              description: The Start hour of the event
 *                              properties:
 *                                  hour:
 *                                      type: integer
 *                                      minimum: 0
 *                                      maximum: 23
 *                                  minutes:
 *                                      type: integer
 *                                      minimum: 0
 *                                      maximum: 59
 *                          endHour:
 *                              type: object
 *                              description: The End hour of the event
 *                              properties:
 *                                  hour:
 *                                      type: integer
 *                                      minimum: 0
 *                                      maximum: 23
 *                                  minutes:
 *                                      type: integer
 *                                      minimum: 0
 *                                      maximum: 59
 *                          name:
 *                              type: string
 *                              description: The name of the event
 *                              example: Bar Stella
 *                          address:
 *                              type: object
 *                              description: The address of the local.
 *                              properties:
 *                                  country:
 *                                      type: string
 *                                      description: The country where the local is.
 *                                      example: Italy
 *                                   city:
 *                                       type: string
 *                                       description: The city where the local is.
 *                                       example: Trento
 *                                   street:
 *                                       type: string
 *                                      description: The street where the local is.
 *                                      example: corso tre novembre
 *                                  number:
 *                                      type: integer
 *                                      description: The house number of the local.
 *                                      example: 15
 *                                  cap:
 *                                      type: string
 *                                      description: The cap of the city.
 *                                      example: 38122
 *                          manager:
 *                              type:string
 *                              description: The name of the event's manager
 *                              example: Mario Rossi
 *                          ageLimit:
 *                              type: integer
 *                              minimum: 0
 *                              description: The minimum age to access the event
 *                          limit_people:
 *                              type: integer
 *                              description: The limit number of people that can participate to the event
 *                              example: 500
 *                          price:
 *                              type: float
 *                              description: The price of the event (zero for a free event)
 *                              example: 12,50
 *                          eventDescription:
 *                              type:string
 *                              description: The description and explanation of the event
 *                              example: In questo locale si festeggia l'arrivo dell'estate
 *                          category:
 *                              type: string
 *                              description: The category of the event (1 or more categories)
 *                              example: music
 *                          photos:
 *                              type: array
 *                              description: Photos of the event
 *                              items:
 *                                  type: string
 *                                  format: binary
 *      responses:
 *          200:
 *              description: Request succesfully processed.
 *          400:
 *              description: Malformed request.
 *          501:
 *              description: Internal server error.
 */
router.post('/create-event', check('Manager'), async function (req, res) {
    try {
        const { id } = req.user.id;
        const manager = await Manager.findOneById(id);
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
        res.status(501).send(e);
    }
});

/**
 * @swagger
 * /v1/users/create-private-event:
 *  post:
 *      description: A participant creates an event
 *      requestBody:
 *          required: true
 *          content:
 *            multipart/form-data:
 *                schema:
 *                  allOf:
 *                    - $ref: '#/components/schemas/Private_event'
 *                    - type: object
 *                      properties:
 *                        photos:
 *                          type: array
 *                          description: Photos of the local.
 *                          items:
 *                            type: string
 *                            format: binary
 *      responses:
 *          200:
 *              description: Request succesfully processed.
 *          400:
 *              description: Malformed request.
 *          501:
 *              description: Internal server error.
 */
router.post(
    '/create-private-event',
    check('Participant'),
    async function (req, res) {
        try {
            const { address } = req.body;
            const result = await Private_event.create({
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
            res.status(501).send(e);
        }
    }
);

/**
 * @swagger
 * /v1/users/subscribe-events:
 *  post:
 *      summary: A manager creates an event
 *      description: A participant subscribes to an event
 *      responses:
 *          200:
 *              description: Request succesfully processed.
 *          400:
 *              description: Malformed request.
 *          501:
 *              description: Internal server error.
 */
router.post(
    '/subscribe-event',
    check('Participant'),
    async function (req, res) {
        try {
            const { id } = req.user;
            const user = await Participant.findOneById(id);
            const event = await Event.findOneById(req.eventid);
            // check if the participant is already subscribed
            if (event.participant_list.find(({ p_id }) => p_id === id))
                res.status(200).json({
                    success: false,
                    message: 'Participant already subscribed',
                });
            // check if the event is already full
            if (event.participant_list.lenght == event.person_limit)
                return res
                    .status(200)
                    .json({ success: false, message: 'event is full' });
            // check if participant is old enough to participate to the event
            if (
                {
                    $dateDiff: {
                        startDate: user.birthDate,      // da rivedere
                        endDate: event.date,
                        unit: 'year',
                    },
                } <= event.age_limit
            )
                res.status(200).json({
                    success: false,
                    message: 'too young to subscribe to this event',
                });

            //if (event.cost != 0), indirizza al pagamento
        } catch (e) {
            res.status(501).send(e);
        }
    }
);

/**
 * @swagger
 * /v1/event/private-area/          ////////"{ticketId}":
 *   get:
 *     description: checking your subscriptions.
 *     parameters:
 *       - in: path
 *         name:                 ticketId
 *         schema:
 *           type: object
 *         required: true
 *         description: QRcode of the ticket
 *     responses:
 *       200:
 *         description: Request succesfully processed.
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

router.get('/private-area/', check ('Participant'), async function (req, res) {
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

