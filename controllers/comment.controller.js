const commentService = require('../services/comment.service');

const createComment = async (req, res, next) => {
  try {
    const { content, parentId } = req.body;
    const { postId } = req.params;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Comment content is required.' });
    }

    const comment = await commentService.createComment(req.user.id, parseInt(postId), { content, parentId });
    res.status(201).json({ success: true, message: 'Comment added.', data: { comment } });
  } catch (error) {
    next(error);
  }
};

const getCommentsByPost = async (req, res, next) => {
  try {
    const result = await commentService.getCommentsByPost(parseInt(req.params.postId), req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Comment content is required.' });
    }

    const comment = await commentService.updateComment(parseInt(req.params.id), req.user.id, { content });
    res.status(200).json({ success: true, message: 'Comment updated.', data: { comment } });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const result = await commentService.deleteComment(parseInt(req.params.id), req.user.id, req.user.role);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = { createComment, getCommentsByPost, updateComment, deleteComment };

