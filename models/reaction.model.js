const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reaction = sequelize.define('Reaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM('LIKE', 'DISLIKE'),
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'reactions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'postId'],
    },
  ],
});

module.exports = Reaction;
