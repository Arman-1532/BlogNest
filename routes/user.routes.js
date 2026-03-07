const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// Public
router.get('/profile/:username', userController.getUserProfile);

// Authenticated
router.put('/profile', authenticate, userController.updateProfile);
router.put('/change-password', authenticate, userController.changePassword);
router.post('/:id/follow', authenticate, userController.followUser);
router.delete('/:id/follow', authenticate, userController.unfollowUser);
router.get('/:id/followers', userController.getFollowers);
router.get('/:id/following', userController.getFollowing);

// Admin
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router;

