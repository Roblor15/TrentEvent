const express = require('express');

const Manager = require('../../models/manager');
const Supervisor = require('../../models/supervisor');
const checkProperties = require('../../lib/check-properties');
const { check } = require('../../lib/authorization');

const router = express.Router();

/**
 * @swagger
 * /v1/supervisors/ban-manager-account:
 *   delete:
 *     description: Ban an account
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
 *
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
router.delete(
    '/ban-manager-account',
    check('Supervisor'),
    async function (req, res) {
        try {
            const manager = await Manager.findById(req.params.id);
            if (!manager) {
                return res.status(200).json({
                    success: false,
                    message: "The manager doesn't exist",
                });
            }
            if (manager === req.user.id) {
                await Manager.deleteOne({
                    _id: req.params.id,
                });
                return res.status(200).json({
                    success: true,
                    message: 'You have banned the manager',
                });
            }
        } catch (e) {
            res.status(501).json({ success: false, message: e.toString() });
        }
    }
);
