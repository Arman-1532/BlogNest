const express = require('express');
const router = express.Router();
const reactionController = require('../controllers/reaction.controller');
const authenticate = require('../middlewares/auth.middleware');

// Public
router.get('/post/:postId', reactionController.getReactionsByPost);

// Authenticated
router.post('/post/:postId', authenticate, reactionController.toggleReaction);
router.get('/post/:postId/me', authenticate, reactionController.getUserReaction);

module.exports = router;

