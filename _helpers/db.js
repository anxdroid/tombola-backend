const config = require('config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    // create db if it doesn't already exist
    const { host, port, user, password, database } = config.database;
    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    // connect to db
    const sequelize = new Sequelize(database, user, password, { host: '192.168.1.9', dialect: 'mysql' });

    // init models and add them to the exported db object
    db.User = require('../users/user.model')(sequelize);
    db.Estrazione = require('../tombola/estrazione.model')(sequelize);
    db.Sessione = require('../tombola/sessione.model')(sequelize);
    db.Cartella = require('../tombola/cartella.model')(sequelize);

    // sync all models with database
    await sequelize.sync();
}