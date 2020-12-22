const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize')
const tombolaService = require('./tombola.service');
const { connect } = require('../users/users.controller');

// routes
router.post('/extract', extract);
router.post('/saveCartella', saveCartella);
router.get('/resumeCartelle/:sessionId/:userId', resumeCartelle);
router.post('/saveSession', saveSession);
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
        ultimoSeq: Joi.number().required(),
        //id: Joi.number().required(),
        costoCartella: Joi.number().required()
    });
    validateRequest(req, next, schema);
}

function checkResult(sessionId) {


}

function saveCartella(req, res, next) {
    //console.log(req.body);
    var sessionId = +req.body.sessionId;
    tombolaService.getSession(sessionId)
        .then(session => {
            ca = req.body.cartella;
            //console.log(session.ultimoSeq, ca.seq);
            if (session.ultimoSeq == ca.seq) {
                body = { "sessionId": sessionId, "userId": req.body.userId, "id": ca.id, "seq": ca.seq }
                body["righe"] = JSON.stringify(ca.indici)
                body["risultati"] = JSON.stringify(ca.risultatiArray)
                body["uuid"] = ca.uuid;
                //console.log(body);
                tombolaService.saveCartella(body)
                    .then(result => {
                        if (session.ultimoSeq > 1) {
                            tombolaService.getCartelleSession(sessionId)
                                .then(cartelle => {
                                    tombolaService.getCartelleSessionSeq(sessionId, session.ultimoSeq)
                                        .then(cartelleSeq => {
                                            console.log(cartelleSeq.length + " cartelle for session " + sessionId + " seq " + session.ultimoSeq + " out of " + cartelle.length)
                                            if (cartelleSeq.length == +cartelle.length) {
                                                console.log("All cartelle are in sync")
                                                var winners = [];
                                                var nuovoRisultato = 0;
                                                for (cartella of cartelleSeq) {
                                                    var risultati = JSON.parse(cartella.risultati);
                                                    for (risultato of risultati) {
                                                        if (+risultato > +(session.ultimoRisultato) && +risultato > 1) {
                                                            nuovoRisultato = +risultato;
                                                            console.log("Last result: " + session.ultimoRisultato, "Cartella " + cartella.id + " result: " + risultati);
                                                            if (!winners.includes(cartella.userId)) {
                                                                winners.push(cartella.userId);
                                                            }
                                                        }
                                                    }
                                                }

                                                if (winners.length > 0) {
                                                    if (winners.length == 1) {
                                                        session.ultimoRisultato = nuovoRisultato;
                                                        session.userIdUltimoRisultato = winners[0];
                                                        //console.log(session.userIdUltimoRisultato);


                                                        tombolaService.saveSession(session.dataValues)
                                                            .then(sessionUpdated => {
                                                                console.log("Last result: " + session.ultimoRisultato + ", Winners " + winners + " (" + nuovoRisultato + ")");
                                                                messaggio = {
                                                                    sessionId: message.sessionId,
                                                                    userId: message.userId,
                                                                    command: "notifyWinner",
                                                                    // TODO: gestire i premi
                                                                    payload: { "winner": session.userIdUltimoRisultato, "seq": session.ultimoSeq, "result": session.ultimoRisultato, "prize": 0 },
                                                                    date: new Date()
                                                                };
                                                                //console.log(messaggio);
                                                                tombolaService.notifyClients(sessionId, message.userId, JSON.stringify(messaggio))
                                                            })
                                                            .catch(next);
                                                    } else {
                                                        // TODO: ributtare il numero
                                                    }
                                                } else {
                                                    res.json(result);
                                                }
                                            }
                                        })
                                        .catch(next);
                                })
                                .catch(next);
                        }else{
                            res.json(result);
                        }
                    })

                    .catch(next);
            }
        })
        .catch(next);



}

function resumeCartelle(req, res, next) {
    tombolaService.resumeCartelle(req.params.sessionId, req.params.userId)
        .then(result => res.json(result))
        .catch(next);
}

function extract(req, res, next) {
    //console.log(sC.socketCollection);
    tombolaService.extract(req.body)
        .then(() => {
            //console.log(req.body);
            messaggio = {
                sessionId: req.body.sessionId,
                userId: 0,
                command: "extract",
                payload: '{"number":' + req.body.number + ', "seq":' + req.body.seq + '}',
                date: new Date()
            };
            tombolaService.notifyClients(req.body.sessionId, req.body.userId, JSON.stringify(messaggio));
            res.json({ message: 'Saved Value: ' + req.body.number });
        })
        .catch(next);
}

function saveSession(req, res, next) {
    //console.log("Getting", req.body);
    tombolaService.saveSession(req.body)
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