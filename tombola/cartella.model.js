const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        sessionId: { type: DataTypes.INTEGER, allowNull: false },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        pagata: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        righe: { type: DataTypes.STRING, allowNull: false, defaultValue: '[]' },
        risultati: { type: DataTypes.STRING, allowNull: false, defaultValue: '[]' },
        maxRisultato: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        totRisultato: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        seq: { type: DataTypes.INTEGER, allowNull: false, defaultValue: -1 },
        uuid: { type: DataTypes.STRING, allowNull: false }
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

    return sequelize.define('Cartella', attributes, options);
}