const groupService = require('../services/group.service');

const createGroup = async (req, res, next) => {
    try {
        const { name, description, coverImage } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Group name is required.' });
        }
        const group = await groupService.createGroup(req.user.id, { name, description, coverImage });
        res.status(201).json({ success: true, message: 'Group created successfully.', data: { group } });
    } catch (error) {
        next(error);
    }
};

const getMyGroups = async (req, res, next) => {
    try {
        const groups = await groupService.getMyGroups(req.user.id);
        res.status(200).json({ success: true, data: { groups } });
    } catch (error) {
        next(error);
    }
};

const getGroupById = async (req, res, next) => {
    try {
        const group = await groupService.getGroupById(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: { group } });
    } catch (error) {
        next(error);
    }
};

const joinGroup = async (req, res, next) => {
    try {
        const result = await groupService.joinGroup(req.params.id, req.user.id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

const approveOrReject = async (req, res, next) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        const result = await groupService.approveOrReject(req.params.id, req.user.id, parseInt(req.params.userId), action);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

const getGroupMembers = async (req, res, next) => {
    try {
        const members = await groupService.getGroupMembers(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: { members } });
    } catch (error) {
        next(error);
    }
};

const getGroupPosts = async (req, res, next) => {
    try {
        const result = await groupService.getGroupPosts(req.params.id, req.user.id, req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const createGroupPost = async (req, res, next) => {
    try {
        const { title, content, coverImage, tags } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and content are required.' });
        }
        if (!tags || tags.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one tag is required.' });
        }
        const post = await groupService.createGroupPost(req.params.id, req.user.id, { title, content, coverImage, tags });
        res.status(201).json({ success: true, message: 'Post created in group.', data: { post } });
    } catch (error) {
        next(error);
    }
};

const leaveGroup = async (req, res, next) => {
    try {
        const result = await groupService.leaveGroup(req.params.id, req.user.id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

const deleteGroup = async (req, res, next) => {
    try {
        const result = await groupService.deleteGroup(req.params.id, req.user.id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

const inviteUser = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const result = await groupService.inviteUser(req.params.id, req.user.id, parseInt(userId));
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

const getInviteSuggestions = async (req, res, next) => {
    try {
        const users = await groupService.getInviteSuggestions(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: { users } });
    } catch (error) {
        next(error);
    }
};

const acceptInvite = async (req, res, next) => {
    try {
        const result = await groupService.acceptInvite(req.params.id, req.user.id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

const rejectInvite = async (req, res, next) => {
    try {
        const result = await groupService.rejectInvite(req.params.id, req.user.id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

const getMyInvites = async (req, res, next) => {
    try {
        const groups = await groupService.getMyInvites(req.user.id);
        res.status(200).json({ success: true, data: { groups } });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createGroup,
    getMyGroups,
    getGroupById,
    joinGroup,
    approveOrReject,
    getGroupMembers,
    getGroupPosts,
    createGroupPost,
    leaveGroup,
    deleteGroup,
    inviteUser,
    getInviteSuggestions,
    acceptInvite,
    rejectInvite,
    getMyInvites,
};
