const express = require('express');

const Manager = require('../../models/manager');
//const Supervisor = require('../../models/supervisor');
const checkProperties = require('../../lib/check-properties');
const { check } = require('../../lib/authorization');

const router = express.Router();

/**
 * @swagger
 * /v1/supervisors/ban-manager-account:
 *   put:
 *     description: Accept a new manager request
 *     tags:
 *       - Manager
 *     security:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["id"]
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: The id of the manager to accept.
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
router.put(
    '/accept-manager',
    checkProperties(['id', 'approved']),
    async function (req, res) {
        try {
            const { id, approved } = req.body;
            const manager = await Manager.findById(id);
            if (!manager) {
                return res.status(200).json({
                    success: false,
                    message: "The manager doesn't exist",
                });
            }
            if (!manager.verifiedEmail) {
                return res.status(200).json({
                    success: false,
                    message: 'The manager is not yet verified exist',
                });
            }

            if (manager.verifiedEmail) {
                manager.approvation = approved;
                if (!approved) {
                    manager.approvation.approved = true;
                    return res.status(200).json({
                        success: true,
                        message: 'You have accepted the new manager',
                    });
                }
            }
        } catch (e) {
            res.status(501).json({ success: false, message: e.toString() });
        }
    }
);
/**
 * @swagger
 * /v1/supervisors/ban-manager-account:
 *   put:
 *     description: Ban a manager account
 *     tags:
 *       - Manager
 *     security:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["id"]
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: The id of the manager to ban.
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
router.put('/ban-manager-account', check('Manager'), async function (req, res) {
    try {
        const { id, approved } = req.body;
        const manager = await Manager.findById(id);

        if (!manager) {
            return res.status(200).json({
                success: false,
                message: "The manager doesn't exist",
            });
        }
        if (manager) {
            manager.approvation = approved;
            if (approved) {
                manager.approvation.approved = false;
                return res.status(200).json({
                    success: true,
                    message: 'You have banned the manager',
                });
            }
        }
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});
