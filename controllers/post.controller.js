const postService = require('../services/post.service');

const createPost = async (req, res, next) => {
  try {
    const { title, content, coverImage, status, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    if (!tags || tags.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one tag is required.' });
    }

    const post = await postService.createPost(req.user.id, { title, content, coverImage, status, tags });
    res.status(201).json({ success: true, message: 'Post created successfully.', data: { post } });
  } catch (error) {
    next(error);
  }
};

const getAllPosts = async (req, res, next) => {
  try {
    const result = await postService.getAllPosts(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getPostBySlug = async (req, res, next) => {
  try {
    const post = await postService.getPostBySlug(req.params.slug);
    res.status(200).json({ success: true, data: { post } });
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const post = await postService.getPostById(req.params.id);
    res.status(200).json({ success: true, data: { post } });
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const { tags } = req.body;
    if (tags === '') {
      return res.status(400).json({ success: false, message: 'Tags cannot be empty.' });
    }
    const post = await postService.updatePost(req.params.id, req.user.id, req.body);
    res.status(200).json({ success: true, message: 'Post updated successfully.', data: { post } });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const result = await postService.deletePost(req.params.id, req.user.id, req.user.role);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getUserPosts = async (req, res, next) => {
  try {
    const result = await postService.getUserPosts(req.params.userId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPost, getAllPosts, getPostBySlug, getPostById, updatePost, deletePost, getUserPosts };

