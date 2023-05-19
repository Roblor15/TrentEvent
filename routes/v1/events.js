const express = require('express');

const router = express.Router();

/**
 * @swagger
 * /v1/events/:
 *   get:
 *     description: Accept or deny the request of an event's info
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
 *                         maximum: 2023
 *                       month:
 *                         type: integer
 *                         minimum: 1
 *                         maximum: 12
 *                       day:
 *                         type:
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
 *                   organizer:
 *                     type:string
 *                     description: The name of the event's organizer
 *                   ageLimit:
 *                     type: integer
 *                     minimum: 0
 *                     description: The minimum age to access the event
 *                   limit_people:
 *                     type:integer
 *                     description: The limit number of people that can participate to the event
 *                   price:
 *                     type: ------------------------
 *                     description: The price of the event (zero for a free event)
 *                     example: 12,5
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
 *
 *         description: Request succesfully processed.
 *       400:
 *         description: Malformed request.
 *       401:
 *         description: Not Authorized.
 *       501:
 *         description: Internal server error.
 */
