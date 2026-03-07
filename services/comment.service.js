const { Comment, User, Post, Notification } = require('../models');
const { paginate, paginatedResult } = require('../utils/pagination');

const createComment = async (userId, postId, { content, parentId }) => {
  const post = await Post.findByPk(postId);
  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  if (parentId) {
    const parentComment = await Comment.findByPk(parentId);
    if (!parentComment || parentComment.postId !== postId) {
      const error = new Error('Parent comment not found on this post.');
      error.statusCode = 404;
      throw error;
    }
  }

  const comment = await Comment.create({ content, userId, postId, parentId: parentId || null });

  // Notify post author
  if (post.userId !== userId) {
    const commenter = await User.findByPk(userId);
    await Notification.create({
      type: 'comment',
      message: `${commenter.username} commented on your post: "${post.title}"`,
      userId: post.userId,
      fromUserId: userId,
      postId,
    });
  }

  // Notify parent comment author for replies
  if (parentId) {
    const parentComment = await Comment.findByPk(parentId);
    if (parentComment.userId !== userId) {
      const commenter = await User.findByPk(userId);
      await Notification.create({
        type: 'comment',
        message: `${commenter.username} replied to your comment on "${post.title}"`,
        userId: parentComment.userId,
        fromUserId: userId,
        postId,
      });
    }
  }

  const fullComment = await Comment.findByPk(comment.id, {
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
  });

  return fullComment;
};

const getCommentsByPost = async (postId, query) => {
  const { page, limit, offset } = paginate(query);

  const post = await Post.findByPk(postId);
  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  // Fetch all comments for the post (to build a nested tree) including user info
  const allComments = await Comment.findAll({
    where: { postId },
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
    order: [['createdAt', 'ASC']],
  });

  // Convert to plain objects and build a map
  const map = {};
  allComments.forEach(c => {
    const obj = c.get({ plain: true });
    obj.replies = [];
    map[obj.id] = obj;
  });

  // Build tree
  const roots = [];
  Object.values(map).forEach(obj => {
    if (obj.parentId) {
      if (map[obj.parentId]) {
        map[obj.parentId].replies.push(obj);
      }
      // if parent not found, skip (shouldn't happen because of validation on create)
    } else {
      roots.push(obj);
    }
  });

  const count = roots.length;
  const rows = roots.slice(offset, offset + limit);

  return paginatedResult(rows, count, page, limit);
};

const updateComment = async (commentId, userId, { content }) => {
  const comment = await Comment.findByPk(commentId);

  if (!comment) {
    const error = new Error('Comment not found.');
    error.statusCode = 404;
    throw error;
  }

  if (comment.userId !== userId) {
    const error = new Error('Not authorized to update this comment.');
    error.statusCode = 403;
    throw error;
  }

  await comment.update({ content });
  return comment;
};

const deleteComment = async (commentId, userId, userRole) => {
  const comment = await Comment.findByPk(commentId);

  if (!comment) {
    const error = new Error('Comment not found.');
    error.statusCode = 404;
    throw error;
  }

  if (comment.userId !== userId && userRole !== 'admin') {
    const error = new Error('Not authorized to delete this comment.');
    error.statusCode = 403;
    throw error;
  }

  await comment.destroy();
  return { message: 'Comment deleted successfully.' };
};

module.exports = { createComment, getCommentsByPost, updateComment, deleteComment };
