const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authenticate = require('../middlewares/auth.middleware');

// Public
router.get('/', postController.getAllPosts);
router.get('/slug/:slug', postController.getPostBySlug);
router.get('/user/:userId', postController.getUserPosts);
router.get('/:id', postController.getPostById);

// Authenticated
router.post('/', authenticate, postController.createPost);
router.put('/:id', authenticate, postController.updatePost);
router.delete('/:id', authenticate, postController.deletePost);

module.exports = router;

