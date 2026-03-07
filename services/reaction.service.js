const { Reaction, Post, User, Notification } = require('../models');

const toggleReaction = async (userId, postId, type) => {
  const post = await Post.findByPk(postId);
  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  const existingReaction = await Reaction.findOne({ where: { userId, postId } });

  if (existingReaction) {
    if (existingReaction.type === type) {
      await existingReaction.destroy();
      return { message: `${type} removed.`, reaction: null };
    } else {
      await existingReaction.update({ type });
      return { message: `Reaction changed to ${type}.`, reaction: existingReaction };
    }
  }

  const reaction = await Reaction.create({ type, userId, postId });

  // Notify post author
  if (post.userId !== userId) {
    const reactor = await User.findByPk(userId);
    await Notification.create({
      type: 'reaction',
      message: `${reactor.username} ${type.toLowerCase()}d your post: "${post.title}"`,
      userId: post.userId,
      fromUserId: userId,
      postId,
    });
  }

  return { message: `${type} added.`, reaction };
};

const getReactionsByPost = async (postId) => {
  const post = await Post.findByPk(postId);
  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  const likes = await Reaction.count({ where: { postId, type: 'LIKE' } });
  const dislikes = await Reaction.count({ where: { postId, type: 'DISLIKE' } });

  const reactions = await Reaction.findAll({
    where: { postId },
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
  });

  return { likes, dislikes, reactions };
};

const getUserReaction = async (userId, postId) => {
  const reaction = await Reaction.findOne({ where: { userId, postId } });
  return reaction;
};

module.exports = { toggleReaction, getReactionsByPost, getUserReaction };

