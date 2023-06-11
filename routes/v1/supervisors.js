const express = require('express');

const Manager = require('../../models/manager');
const checkProperties = require('../../lib/check-properties');
const { check } = require('../../lib/authorization');
const { generatePassword } = require('../../lib/general');
const sendMail = require('../../lib/notify');

const router = express.Router();

/**
 * @swagger
 * /v1/supervisors/manager-approvation:
 *   put:
 *     description: Accept or deny the request to become Events Mangager.
 *     tags:
 *       - supervisors
 *     security:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["id", "approved"]
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: The id of the request to approve.
 *               approved:
 *                 type: boolean
 *                 description: If the request is approved or not.
 *               sendEmail:
 *                 type: boolean
 *                 description: Decide if send an email
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
 *                     manager:
 *                       $ref: '#/components/schemas/Manager'
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
    '/manager-approvation',
    check('Supervisor'),
    checkProperties(['id', 'approved']),
    async function (req, res) {
        try {
            // retrieve id and approved from body
            const { id, approved } = req.body;

            // find and update the manager
            const user = await Manager.findById(id);

            // throw an error if user not found
            if (!user) throw new Error('User not found');

            // control if the email address is confermed
            if (user.verifiedEmail) {
                user.approvation = {
                    approved,
                    when: Date.now(),
                };

                // create body of the email
                let html;
                if (approved) {
                    // create a new password for the user
                    const newPassword = generatePassword(12);

                    user.password = newPassword;

                    html = `<p>Ciao ${user.localName},<br/>
                        La tua richiesta per diventare Organizzatore di eventi è stata accettata.</p>
                        <p>Per accedere al tuo account usa le credenziali:<br/>
                        <b>email</b>: ${user.email}<br/>
                        <b>password</b>: ${newPassword}</p>`;
                } else {
                    html = `<p>Ciao ${user.localName},</p>
                        <p>La tua richiesta per diventare Organizzatore di eventi è stata rifiutata.</p>`;
                }

                await user.save();

                if (req.body.sendEmail === true) {
                    // send the email
                    await sendMail({
                        to: user.email,
                        subject: 'Richiesta Organizzatore di eventi',
                        html,
                        textEncoding: 'base64',
                    });
                }

                // response with main fields of manager
                res.status(200).json({
                    success: true,
                    message: "Manager's request updated",
                    manager: {
                        localName: user.localName,
                        email: user.email,
                        address: user.address,
                        localType: user.localType,
                    },
                });
            } else {
                // response with main fields of manager
                res.status(200).json({
                    success: false,
                    message: "Manager's email is not confermed",
                    manager: {
                        localName: user.localName,
                        email: user.email,
                        address: user.address,
                        localType: user.localType,
                    },
                });
            }
        } catch (e) {
            res.status(501).json({ success: false, message: e.toString() });
        }
    }
);

/**
 * @swagger
 * /v1/report/:
 *   get:
 *     description: check managers
 *     tags:
 *       - supervisors
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
router.get('/manager', check('Supervisor'), async function (req, res) {
    try {
        const managers = await Manager.find();

        res.status(200).json({
            success: true,
            message: 'Here are the managers',
            managers,
        });
    } catch (e) {
        res.status(501).json({ success: false, message: e.toString() });
    }
});

module.exports = router;
