const { sequelize } = require('../config/database');
const User = require('./user.model');
const Post = require('./post.model');
const Comment = require('./comment.model');
const Follow = require('./follow.model');
const Reaction = require('./reaction.model');
const Notification = require('./notification.model');
const Group = require('./group.model');
const GroupMember = require('./groupMember.model');

// User <-> Post
User.hasMany(Post, { foreignKey: 'userId', as: 'posts', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// User <-> Comment
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post <-> Comment
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Comment self-referencing (nested replies)
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies', onDelete: 'CASCADE' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

// Follow (User follows User)
User.belongsToMany(User, { through: Follow, as: 'following', foreignKey: 'followerId', otherKey: 'followingId' });
User.belongsToMany(User, { through: Follow, as: 'followers', foreignKey: 'followingId', otherKey: 'followerId' });
Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'followingId', as: 'followingUser' });

// Post <-> Reaction
Post.hasMany(Reaction, { foreignKey: 'postId', as: 'reactions', onDelete: 'CASCADE' });
Reaction.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User <-> Reaction
User.hasMany(Reaction, { foreignKey: 'userId', as: 'reactions', onDelete: 'CASCADE' });
Reaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Notification.belongsTo(User, { foreignKey: 'fromUserId', as: 'fromUser' });
Notification.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Group <-> User (creator)
User.hasMany(Group, { foreignKey: 'creatorId', as: 'createdGroups', onDelete: 'CASCADE' });
Group.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

// Group <-> GroupMember
Group.hasMany(GroupMember, { foreignKey: 'groupId', as: 'members', onDelete: 'CASCADE' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

// User <-> GroupMember
User.hasMany(GroupMember, { foreignKey: 'userId', as: 'groupMemberships', onDelete: 'CASCADE' });
GroupMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Group <-> Post
Group.hasMany(Post, { foreignKey: 'groupId', as: 'posts', onDelete: 'CASCADE' });
Post.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

module.exports = {
  sequelize,
  User,
  Post,
  Comment,
  Follow,
  Reaction,
  Notification,
  Group,
  GroupMember,
};
