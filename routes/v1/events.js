const express = require('express');
const multer = require('multer');
//const { getGoogleAuthLink, verify } = require('../../google-auth');
const jwt = require('jsonwebtoken');

//const Manager = require('../../models/managers');
const Partecipant = require('../../models/participant');

const router = express.Router();

// save files in memory
// da cambiare l'indirizzo di memoria --> const upload = multer({ storage: multer.memoryStorage() });

let eventi =[
  {
    "data:" 
    "tytle:" 


  }


]



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
 *                   name:
 *                     type: string
 *                     description: The name of the event
 *                 
 *                   approved:
 *                     type: boolean
 *                     description: If the request is approved or not.
 *         description: Request succesfully processed.
 *       400:
 *         description: Malformed request.
 *       401:
 *         description: Not Authorized.
 *       501:
 *         description: Internal server error.
 */

