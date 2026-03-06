const { User, Post, Follow, Notification } = require('../models');
const { hashPassword } = require('../utils/hashPassword');
const { paginate, paginatedResult } = require('../utils/pagination');

const getUserProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({
      where: { username },
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const postsCount = await Post.count({ where: { userId: user.id } });
    const followersCount = await Follow.count({ where: { followingId: user.id } });
    const followingCount = await Follow.count({ where: { followerId: user.id } });

    res.status(200).json({
      success: true,
      data: { user, postsCount, followersCount, followingCount },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { username, bio, avatar } = req.body;
    const user = await User.findByPk(req.user.id);

    if (username && username !== user.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Username already taken.' });
      }
    }

    await user.update({ username: username || user.username, bio: bio !== undefined ? bio : user.bio, avatar: avatar !== undefined ? avatar : user.avatar });

    const updated = await User.findByPk(user.id, { attributes: { exclude: ['password'] } });
    res.status(200).json({ success: true, message: 'Profile updated.', data: { user: updated } });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    const user = await User.findByPk(req.user.id);
    const { comparePassword } = require('../utils/hashPassword');
    const isMatch = await comparePassword(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashed = await hashPassword(newPassword);
    await user.update({ password: hashed });

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

const followUser = async (req, res, next) => {
  try {
    const followingId = parseInt(req.params.id);
    const followerId = req.user.id;

    if (followerId === followingId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
    }

    const targetUser = await User.findByPk(followingId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const existing = await Follow.findOne({ where: { followerId, followingId } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Already following this user.' });
    }

    await Follow.create({ followerId, followingId });

    // Notify the followed user
    await Notification.create({
      type: 'follow',
      message: `${req.user.username} started following you.`,
      userId: followingId,
      fromUserId: followerId,
    });

    res.status(201).json({ success: true, message: `You are now following ${targetUser.username}.` });
  } catch (error) {
    next(error);
  }
};

const unfollowUser = async (req, res, next) => {
  try {
    const followingId = parseInt(req.params.id);
    const followerId = req.user.id;

    const follow = await Follow.findOne({ where: { followerId, followingId } });
    if (!follow) {
      return res.status(404).json({ success: false, message: 'You are not following this user.' });
    }

    await follow.destroy();
    res.status(200).json({ success: true, message: 'Unfollowed successfully.' });
  } catch (error) {
    next(error);
  }
};

const getFollowers = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { page, limit, offset } = paginate(req.query);

    const { count, rows } = await Follow.findAndCountAll({
      where: { followingId: userId },
      include: [{ model: User, as: 'follower', attributes: ['id', 'username', 'avatar', 'bio'] }],
      limit,
      offset,
    });

    const followers = rows.map((f) => f.follower);
    res.status(200).json({ success: true, data: paginatedResult(followers, count, page, limit) });
  } catch (error) {
    next(error);
  }
};

const getFollowing = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { page, limit, offset } = paginate(req.query);

    const { count, rows } = await Follow.findAndCountAll({
      where: { followerId: userId },
      include: [{ model: User, as: 'followingUser', attributes: ['id', 'username', 'avatar', 'bio'] }],
      limit,
      offset,
    });

    const following = rows.map((f) => f.followingUser);
    res.status(200).json({ success: true, data: paginatedResult(following, count, page, limit) });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);

    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({ success: true, data: paginatedResult(rows, count, page, limit) });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin user.' });
    }

    await user.destroy();
    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserProfile, updateProfile, changePassword, followUser, unfollowUser, getFollowers, getFollowing, getAllUsers, deleteUser };

