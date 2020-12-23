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
router.get('/test/:sessionId', test);

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

function test(req, res, next) {
    //console.log(req.params);
    var sessionId = req.params.sessionId;
    tombolaService.getSession(sessionId)
        .then(session => {
            session = session.get({ plain: true });
            var seq = session.ultimoSeq;
            tombolaService.getCartelleSessionCount(sessionId)
                .then(data1 => {
                    //console.log(data1);
                    tombolaService.getCartelleSessionSeqCount(sessionId, seq)
                        .then(data2 => {
                            tombolaService.getCartelleSessionSeqResult(sessionId, seq, +(session.ultimoRisultato) + 1)
                                .then(data3 => {
                                    //console.log(data3);
                                    res.json({ session: session, data1: data1, data2: data2, data3: data3 })
                                })
                                .catch(next);
                        })
                        .catch(next);
                })
                .catch(next);
        })
        .catch(next);
}

function saveCartella(req, res, next) {
    //console.log(req.body);
    var sessionId = +req.body.sessionId;
    // carico le info sulla sessione
    tombolaService.getSession(sessionId)
        .then(session => {
            session = session.get({ plain: true });
            ca = req.body.cartella;
            // controllo che la cartella sia in sync con la sessione
            if (session.ultimoSeq == ca.seq) {
                body = { "sessionId": sessionId, "userId": req.body.userId, "id": ca.id, "seq": ca.seq, "maxRisultato": ca.maxRisultato, "totRisultato": ca.totRisultato }
                body["righe"] = JSON.stringify(ca.indici)
                body["risultati"] = JSON.stringify(ca.risultatiArray)
                body["uuid"] = ca.uuid;

                // salvo la cartella
                tombolaService.saveCartella(body)
                    .then(result => {
                        // controllo solo dalla seconda estrazione
                        if (session.ultimoSeq >= 1) {
                            // carico il numero di cartelle della sessione
                            tombolaService.getCartelleSessionCount(sessionId)
                                .then(cartelleCount => {
                                    // carico il numero di cartelle aggiornate al round attuale (numero 'seq' da session)
                                    tombolaService.getCartelleSessionSeqCount(sessionId, session.ultimoSeq)
                                        .then(cartelleSeqCount => {
                                            // tutte le cartelle sono in sync
                                            //console.log("tot: "+cartelleCount, "sync'd: "+cartelleSeqCount);
                                            if (cartelleSeqCount == cartelleCount) {
                                                //console.log("all sync'd !", session);
                                                var nuovoRisultato = 1+(session.ultimoRisultato);
                                                
                                                if (nuovoRisultato == 1) {
                                                    nuovoRisultato = 2;
                                                } else if (nuovoRisultato > 5) {
                                                    nuovoRisultato = 15;
                                                }

                                                // carico le cartelle che hanno fatto un punteggio valido per il prossimo premio
                                                tombolaService.getCartelleSessionSeqResult(sessionId, session.ultimoSeq, nuovoRisultato)
                                                    .then(cartelleSeq => {
                                                        //console.log(cartelleSeq)
                                                        var winners = [];
                                                        for (cartella of cartelleSeq) {
                                                            // se le cartella ha totalizzato il punteggio richiesto per riga o se ha fatto tombola
                                                            if (nuovoRisultato <= 5 || +(cartella.totRisultato) == 15) {
                                                                // includo l'utente nella lista dei potenziali vincitori
                                                                if (!winners.includes(cartella.userId)) {
                                                                    winners.push(cartella.userId);
                                                                }
                                                            }
                                                        }

                                                        if (winners.length > 0) {
                                                            // se abbiamo un solo vincitore, assegno il premio
                                                            if (winners.length == 1) {
                                                                console.log("Last result: " + session.ultimoRisultato + ", Winners " + winners + " (" + nuovoRisultato + ")");
                                                                if (cartella.totRisultato == 15) {
                                                                    console.log(winners, "Tombola !");
                                                                }
                                                                session.ultimoRisultato = nuovoRisultato;
                                                                
                                                                session.userIdUltimoRisultato = winners[0];

                                                                //aggiorno la sessione con l'ultimo vincitore
                                                                tombolaService.saveSession(session)
                                                                    .then(sessionUpdated => {
                                                                        // notifico via websocket la vincita
                                                                        messaggio = {
                                                                            sessionId: sessionId,
                                                                            userId: 0,
                                                                            command: "notifyWinner",
                                                                            // TODO: gestire i premi
                                                                            payload: { "winner": session.userIdUltimoRisultato, "seq": session.ultimoSeq, "result": session.ultimoRisultato, "prize": 0 },
                                                                            date: new Date()
                                                                        };
                                                                        tombolaService.notifyClients(sessionId, 0, JSON.stringify(messaggio))
                                                                        res.json(sessionUpdated);
                                                                    })
                                                                    .catch(next);
                                                            } else {
                                                                // TODO: ributtare il numero
                                                                res.json(result);
                                                            }
                                                        } else {
                                                            res.json(result);
                                                        }

                                                    })
                                                    .catch(next);
                                            } else {
                                                //console.log("Sync skew: " + cartelleSeqCount + " out of " + cartelleCount + " sync'd")
                                                res.json(result);
                                            }
                                        })
                                        .catch(next);
                                })
                                .catch(next);
                        } else {
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