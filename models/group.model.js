const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Group = sequelize.define('Group', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: '',
    },
    coverImage: {
        type: DataTypes.STRING,
        defaultValue: '',
    },
    creatorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'groups',
    timestamps: true,
});

module.exports = Group;
