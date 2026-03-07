const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(250),
    allowNull: false,
    unique: true,
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  coverImage: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'published',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tags: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'posts',
  timestamps: true,
});

module.exports = Post;
