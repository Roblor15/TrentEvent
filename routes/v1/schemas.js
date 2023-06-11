/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Response:
 *       type: object
 *       required: [ "success", "message" ]
 *       properties:
 *         success:
 *           type: boolean
 *           description: If the request was accepted or not.
 *           example: false
 *         message:
 *           type: string
 *           description: An informative message.
 *           example: Error
 *     Participant:
 *       type: object
 *       required: ["name", "surname", "username", "email", "birthDate"]
 *       properties:
 *         name:
 *           type: string
 *           description: the name of the user
 *           example: Mario
 *         surname:
 *           type: string
 *           description: the surname of the user
 *           example: Rossi
 *         username:
 *           type: string}
 *           description: the username of the user
 *           example: mario_rossi18
 *         email:
 *           type: string
 *           description: the email of the user
 *           example: Mario.Rossi@gmail.com
 *         birthDate:
 *           type: string
 *           format: date
 *           description: the birth data of the user
 *     Manager:
 *       type: object
 *       required: ["localName", "email", "address", "localType"]
 *       properties:
 *         localName:
 *           type: string
 *           description: The local's name.
 *           example: Bar Bello
 *         email:
 *           type: string
 *           description: The user's email.
 *           example: mario.rossi@gmail.com
 *         address:
 *           type: object
 *           description: The address of the local.
 *           properties:
 *             country:
 *               type: string
 *               description: The country where the local is.
 *               example: Italy
 *             city:
 *               type: string
 *               description: The city where the local is.
 *               example: Trento
 *             street:
 *               type: string
 *               description: The street where the local is.
 *               example: corso tre novembre
 *             number:
 *               type: integer
 *               description: The house number of the local.
 *               example: 15
 *             cap:
 *               type: string
 *               description: The cap of the city.
 *               example: 38122
 *         localType:
 *           type: string
 *           description: The type of the local.
 *           example: Bar
 *     Event:
 *       type: object
 *       required: ["initDate", "endDate", "name", "description"]
 *       properties:
 *         initDate:
 *           type: string
 *           format: date-time
 *           description: The data when the event inits
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: The data when the event ends
 *         name:
 *           type: string
 *           description: The name of the event
 *         ageLimit:
 *           type: integer
 *           minimum: 0
 *           description: The minimum age to access the event
 *         limitPeople:
 *           type: integer
 *           description: The limit number of people that can participate to the event
 *         price:
 *           type: float
 *           description: The price of the event (zero for a free event) in euros
 *           example: 12,50
 *         description:
 *           type: string
 *           description: The description and explanation of the event
 *         categories:
 *           type: array
 *           description: The category of the event (1 or more categories)
 *           items:
 *             type: string
 *     PrivateEvent:
 *       type: object
 *       required: ["initDate", "endDate", "description"]
 *       properties:
 *         initDate:
 *           type: string
 *           format: date-time
 *           description: The data when the event inits
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: The data when the event ends
 *         price:
 *           type: float
 *           description: The price of the event (zero for a free event) in euros
 *           example: 12,50
 *         description:
 *           type: string
 *           description: The description and explanation of the event
 *         address:
 *           type: object
 *           description: The address of the local.
 *           properties:
 *             country:
 *               type: string
 *               description: The country where the local is.
 *               example: Italy
 *             city:
 *               type: string
 *               description: The city where the local is.
 *               example: Trento
 *             street:
 *               type: string
 *               description: The street where the local is.
 *               example: corso tre novembre
 *             number:
 *               type: integer
 *               description: The house number of the local.
 *               example: 15
 *             cap:
 *               type: string
 *               description: The cap of the city.
 *               example: 38122
 */
// TODO schema report and supervisor

