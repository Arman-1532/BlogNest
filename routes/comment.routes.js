const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const authenticate = require('../middlewares/auth.middleware');

// Public
router.get('/post/:postId', commentController.getCommentsByPost);

// Authenticated
router.post('/post/:postId', authenticate, commentController.createComment);
router.put('/:id', authenticate, commentController.updateComment);
router.delete('/:id', authenticate, commentController.deleteComment);

module.exports = router;

