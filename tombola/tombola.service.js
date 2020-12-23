const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
var sC = require('../socketCollection');
const { Op } = require("sequelize");
const { Sequelize } = require('sequelize');


module.exports = {
  extract,
  saveSession,
  listSessions,
  resumeSession,
  getSession,
  saveCartella,
  resumeCartelle,
  checkResults,
  notifyClients,
  getCartelleSession,
  getCartelleSessionCount,
  getCartelleSessionSeq,
  getCartelleSessionSeqCount,
  getCartelleSessionSeqResult
};

function notifyClients(sessionId, userId, message) {
  //console.log("Notifying for sessionId " + sessionId);
  for (socket of sC.socketCollection) {
    // sessionId = 0 => broadcast
    if (socket.sessionId == sessionId || sessionId == 0) {
      if (userId != socket.userId) {
        //console.log(message, socket.connection.remoteAddress);
        socket.connection.sendUTF(message);
      }
    }
  }
}

async function extract(params) {
  await db.Estrazione.create(params);
}

async function saveCartella(params) {
  if (params.id == null || +params.id == 0) {
    params.id = null;
    return db.Cartella.create(params);
  }
  return db.Cartella.update(params, {
    where: {
      id: params.id
    }
  });
}

async function resumeCartelle(sessionId, userId) {
  return await db.Cartella.findAll({
    where: {
      sessionId: sessionId,
      userId: userId
    }
  });
}

async function checkResults(sessionId, result) {
  return await db.Cartella.findAll({
    where: {
      sessionId: sessionId,
      risultati: { [Op.like]: '%' + result + '%' }
    }
  });
}

function saveSession(params) {
  if (params.id == null || +params.id == 0) {
    params.id = null;
    return db.Sessione.create(params);
  }
  return db.Sessione.update(params, {
    where: {
      id: params.id
    }
  });
}

async function listSessions() {
  return await db.Sessione.findAll();
}

async function resumeSession(sessionId) {
  return await db.Estrazione.findAll({
    where: {
      sessionId: sessionId
    }
  });
}

async function getSession(sessionId) {
  return await db.Sessione.findOne({
    where: {
      id: sessionId
    }
  });
}

async function getCartelleSession(sessionId) {
  return await db.Cartella.findAll({
    where: {
      sessionId: sessionId,
    }
  });
}

async function getCartelleSessionCount(sessionId) {
  return await db.Cartella.count({
    where: {
      sessionId: sessionId,
    }
  });
}

async function getCartelleSessionSeq(sessionId, seq) {
  return await db.Cartella.findAll({
    where: {
      sessionId: sessionId,
      seq: seq
    }
  });
}

async function getCartelleSessionSeqCount(sessionId, seq) {
  return await db.Cartella.count({
    where: {
      sessionId: sessionId,
      seq: seq
    }
  });
}

async function getCartelleSessionSeqResult(sessionId, seq, maxRisultato) {
  return await db.Cartella.findAll({
    where: {
      sessionId: sessionId,
      seq: seq,
      // carico le cartelle col premio corrente e quelle che hanno fatto tombola
      [Op.or]: [{ maxRisultato: maxRisultato }, { totRisultato: 15 }]
    }
  });
}