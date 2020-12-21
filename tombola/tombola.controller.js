const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize')
const tombolaService = require('./tombola.service');
var sC = require('../socketCollection');
const { connect } = require('../users/users.controller');

// routes
router.post('/extract', estrazioneSchema, extract);
router.post('/saveCartella', saveCartella);
router.get('/resumeCartelle/:sessionId/:userId', resumeCartelle);
router.post('/new', sessioneSchema, newSession);
router.get('/list', listSessions);
router.get('/resume/:sessionId', resumeSession);
router.get('/get/:sessionId', getSession);

module.exports = router;

function estrazioneSchema(req, res, next) {
    const schema = Joi.object({
        sessionId: Joi.number().required(),
        userId: Joi.number().required(),
        number: Joi.number().required()
    });
    validateRequest(req, next, schema);
}

function sessioneSchema(req, res, next) {
    const schema = Joi.object({
        userId: Joi.number().required(),
        costoCartella: Joi.number().required()
    });
    validateRequest(req, next, schema);
}

function saveCartella(req, res, next) {
    ca = req.body.cartella;
    body = { "sessionId": req.body.sessionId, "userId": req.body.userId }
    body["righe"] = JSON.stringify(ca.indici)
    body["uuid"] = ca.uuid;
    //console.log(body);
    tombolaService.saveCartella(body)
        .then(result => { res.json(result) })
        .catch(next);
}

function resumeCartelle(req, res, next) {
    tombolaService.resumeCartelle(req.params.sessionId, req.params.userId)
        .then(result => res.json(result))
        .catch(next);
}

function notifyClients(message) {
    for (socket of sC.socketCollection) {
        //console.log(socket.connection);
        socket.connection.sendUTF(message);
    }
}

function extract(req, res, next) {
    //console.log(sC.socketCollection);
    tombolaService.extract(req.body)
        .then(() => {
            notifyClients("Numero "+req.body.number)
            res.json({ message: 'Saved Value: ' + req.body.number });
        })
        .catch(next);
}

function newSession(req, res, next) {
    tombolaService.newSession(req.body)
        .then(result => res.json(result))
        .catch(next);
}

function listSessions(req, res, next) {
    tombolaService.listSessions()
        .then(result => res.json(result))
        .catch(next);
}

function resumeSession(req, res, next) {
    //console.log(req.params);
    tombolaService.resumeSession(req.params.sessionId)
        .then(result => { res.json(result) })
        .catch(next);
}

function getSession(req, res, next) {
    //console.log(req.params);
    tombolaService.getSession(req.params.sessionId)
        .then(result => { res.json(result) })
        .catch(next);
}