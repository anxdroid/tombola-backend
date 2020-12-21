const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');

module.exports = {
    extract,
    newSession,
    listSessions,
    resumeSession,
    getSession,
    saveCartella,
    resumeCartelle
};

async function extract(params) {
    await db.Estrazione.create(params);
}

async function saveCartella(params) {
    return db.Cartella.create(params);
}

async function resumeCartelle(sessionId, userId) {
    return await db.Cartella.findAll({
        where: {
          sessionId: sessionId,
          userId: userId
        }
      });
}

function newSession(params) {
    return db.Sessione.create(params);
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