const express = require('express');

const Manager = require('../../models/manager');
const Event = require('../../models/event');

const { check } = require('../../lib/authorization');

const router = express.Router();

/**
 * @swagger
 * /v1/managers/my-events:
 *   get:
 *     description: A manager get his events
 *     tags:
 *       - managers
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
 *                               participantsList:
 *                                 type: array
 *                                 description: Id of participants
 *                                 items:
 *                                   type: string
 *                                   format: uuid
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
 *             schema:
 *               $ref: '#/components/schemas/Response'
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.get('/my-events', check('Manager'), async function (req, res) {
    try {
        const events = await Event.find({ manager: req.user.id });

        return res.status(200).json({
            success: true,
            message: 'Your events',
            events,
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/managers/infos:
 *   get:
 *     description: A manager checks his informations
 *     tags:
 *       - managers
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
 *                     infos:
 *                       type: object
 *                       allOf:
 *                         - $ref: '#/components/schemas/Manager'
 *                         - type: object
 *                           properties:
 *                             verifiedEmail:
 *                               type: boolean
 *                               description: If the email is verified or not
 *                             photos:
 *                               type: array
 *                               description: Array Id of manager's photos
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
router.get('/infos', check('Manager'), async function (req, res) {
    try {
        const manager = await Manager.findById(req.user.id);

        res.status(200).json({
            success: true,
            message: 'Your infos',
            infos: {
                localName: manager.localName,
                email: manager.email,
                verifiedEmail: manager.verifiedEmail,
                address: manager.address,
                localType: manager.localType,
            },
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/managers/{managerId}:
 *   get:
 *     description: A participant checks a manager's informations
 *     tags:
 *       - managers
 *     parameters:
 *       - in: path
 *         name: managerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the manager
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
 *                     infos:
 *                       type: object
 *                       allOf:
 *                         - $ref: '#/components/schemas/Manager'
 *                         - type: object
 *                           properties:
 *                             photos:
 *                               type: array
 *                               description: Array Id of manager's photos
 *                               items:
 *                                 type: string
 *                                 format: uuid
 *       501:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.get('/:id', check('All'), async function (req, res) {
    try {
        const manager = await Manager.findById(req.params.id);

        if (manager) {
            let approvation = undefined;
            if (req.user?.type === 'Supervisor') {
                approvation = manager.approvation;
            }
            return res.status(200).json({
                success: true,
                message: 'Manager infos',
                infos: {
                    localName: manager.localName,
                    email: manager.email,
                    address: manager.address,
                    localType: manager.localType,
                    approvation,
                },
            });
        } else {
            return res.status(200).json({
                success: false,
                message: "Manager doesn't exist",
            });
        }
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

/**
 * @swagger
 * /v1/managers/{managerId}/events:
 *   get:
 *     description: Get events created by a manager
 *     tags:
 *       - managers
 *     parameters:
 *       - in: path
 *         name: managerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the manager
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
router.get('/:id/events', async function (req, res) {
    try {
        const manager = await Manager.findById(req.params.id);

        if (manager) {
            const events = (
                await Event.find({
                    manager: req.params.id,
                })
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
                message: 'Manager infos',
                events,
            });
        } else {
            return res.status(200).json({
                success: false,
                message: "Manager doesn't exist",
            });
        }
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

module.exports = router;
