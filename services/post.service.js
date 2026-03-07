const { Post, User, Comment, Reaction, Follow, Notification } = require('../models');
const { paginate, paginatedResult } = require('../utils/pagination');

const createSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Date.now();
};

const createPost = async (userId, { title, content, coverImage, status, tags }) => {
  const slug = createSlug(title);
  const post = await Post.create({ title, slug, content, coverImage, status, tags, userId });

  // Notify all followers
  const follows = await Follow.findAll({ where: { followingId: userId } });
  const author = await User.findByPk(userId);

  const notifications = follows.map((f) => ({
    type: 'post',
    message: `${author.username} published a new post: "${title}"`,
    userId: f.followerId,
    fromUserId: userId,
    postId: post.id,
  }));

  if (notifications.length > 0) {
    await Notification.bulkCreate(notifications);
  }

  return post;
};

const getAllPosts = async (query) => {
  const { page, limit, offset } = paginate(query);
  const { Op } = require('sequelize');

  const where = { status: 'published', groupId: null };

  if (query.search && query.search.trim()) {
    const search = `%${query.search.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: search } },
      { tags: { [Op.like]: search } },
    ];
  }

  const { count, rows } = await Post.findAndCountAll({
    where,
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return paginatedResult(rows, count, page, limit);
};

const getPostBySlug = async (slug) => {
  const post = await Post.findOne({
    where: { slug },
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'avatar', 'bio'] },
      { model: Reaction, as: 'reactions' },
    ],
  });

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  // Build a nested comments tree (include all levels of replies)
  const allComments = await Comment.findAll({
    where: { postId: post.id },
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
    order: [['createdAt', 'ASC']],
  });

  const map = {};
  allComments.forEach(c => {
    const obj = c.get({ plain: true });
    obj.replies = [];
    map[obj.id] = obj;
  });

  const roots = [];
  Object.values(map).forEach(obj => {
    if (obj.parentId) {
      if (map[obj.parentId]) {
        map[obj.parentId].replies.push(obj);
      }
    } else {
      roots.push(obj);
    }
  });

  // attach nested comments to the post object
  post.dataValues.comments = roots;

  return post;
};

const getPostById = async (id) => {
  const post = await Post.findByPk(id, {
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
    ],
  });

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  return post;
};

const updatePost = async (postId, userId, data) => {
  const post = await Post.findByPk(postId);

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  if (post.userId !== userId) {
    const error = new Error('Not authorized to update this post.');
    error.statusCode = 403;
    throw error;
  }

  if (data.title) {
    data.slug = createSlug(data.title);
  }

  await post.update(data);
  return post;
};

const deletePost = async (postId, userId, userRole) => {
  const post = await Post.findByPk(postId);

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  if (post.userId !== userId && userRole !== 'admin') {
    const error = new Error('Not authorized to delete this post.');
    error.statusCode = 403;
    throw error;
  }

  await post.destroy();
  return { message: 'Post deleted successfully.' };
};

const getUserPosts = async (userId, query) => {
  const { page, limit, offset } = paginate(query);

  const { count, rows } = await Post.findAndCountAll({
    where: { userId },
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return paginatedResult(rows, count, page, limit);
};

module.exports = { createPost, getAllPosts, getPostBySlug, getPostById, updatePost, deletePost, getUserPosts };
