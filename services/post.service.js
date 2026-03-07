const { Post, User, Comment, Reaction, Follow, Notification } = require('../models');
const { paginate, paginatedResult } = require('../utils/pagination');

const createSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Date.now();
};

const createPost = async (userId, { title, content, coverImage, status }) => {
  const slug = createSlug(title);
  const post = await Post.create({ title, slug, content, coverImage, status, userId });

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

  const { count, rows } = await Post.findAndCountAll({
    where: { status: 'published' },
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
      {
        model: Comment,
        as: 'comments',
        where: { parentId: null },
        required: false,
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'avatar'] },
          {
            model: Comment,
            as: 'replies',
            include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
          },
        ],
        order: [['createdAt', 'DESC']],
      },
      { model: Reaction, as: 'reactions' },
    ],
  });

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

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
