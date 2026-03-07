const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const auth = require('../middlewares/auth.middleware');

// All group routes require authentication
router.get('/invites', auth, groupController.getMyInvites);
router.post('/', auth, groupController.createGroup);
router.get('/my', auth, groupController.getMyGroups);
router.get('/:id', auth, groupController.getGroupById);
router.post('/:id/join', auth, groupController.joinGroup);
router.put('/:id/members/:userId', auth, groupController.approveOrReject);
router.get('/:id/members', auth, groupController.getGroupMembers);
router.get('/:id/posts', auth, groupController.getGroupPosts);
router.post('/:id/posts', auth, groupController.createGroupPost);
router.get('/:id/invite-suggestions', auth, groupController.getInviteSuggestions);
router.post('/:id/invite', auth, groupController.inviteUser);
router.post('/:id/accept', auth, groupController.acceptInvite);
router.post('/:id/reject', auth, groupController.rejectInvite);
router.delete('/:id/leave', auth, groupController.leaveGroup);
router.delete('/:id', auth, groupController.deleteGroup);

module.exports = router;
