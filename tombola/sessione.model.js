const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        userId: { type: DataTypes.INTEGER, allowNull: false },
        costoCartella: { type: DataTypes.FLOAT, allowNull: false },
        // 0: creata, 1: in corso, 2: finita
        stato: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        ultimoRisultato: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        userIdUltimoRisultato: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
    };

    const options = {
        defaultScope: {
            // exclude hash by default
            attributes: { exclude: ['hash'] }
        },
        scopes: {
            // include hash with this scope
            withHash: { attributes: {}, }
        }
    };

    return sequelize.define('Session', attributes, options);
}