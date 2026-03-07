const { Group, GroupMember, Post, User } = require('../models');
const { paginate, paginatedResult } = require('../utils/pagination');
const { Op } = require('sequelize');

const createGroup = async (userId, { name, description, coverImage }) => {
    const group = await Group.create({ name, description, coverImage, creatorId: userId });

    // Auto-add creator as admin member
    await GroupMember.create({ groupId: group.id, userId, role: 'admin', status: 'approved' });

    return group;
};

const getMyGroups = async (userId) => {
    const memberships = await GroupMember.findAll({
        where: { userId, status: 'approved' },
        include: [
            {
                model: Group,
                as: 'group',
                include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'avatar'] }],
            },
        ],
        order: [['createdAt', 'DESC']],
    });

    // Attach member count to each group
    const groups = [];
    for (const m of memberships) {
        const group = m.group.get({ plain: true });
        group.memberCount = await GroupMember.count({ where: { groupId: group.id, status: 'approved' } });
        group.myRole = m.role;
        groups.push(group);
    }

    return groups;
};

const getGroupById = async (groupId, userId) => {
    const group = await Group.findByPk(groupId, {
        include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'avatar'] }],
    });

    if (!group) {
        const error = new Error('Group not found.');
        error.statusCode = 404;
        throw error;
    }

    const membership = await GroupMember.findOne({ where: { groupId, userId, status: 'approved' } });
    const pending = await GroupMember.findOne({ where: { groupId, userId, status: 'pending' } });
    const invited = await GroupMember.findOne({ where: { groupId, userId, status: 'invited' } });
    const memberCount = await GroupMember.count({ where: { groupId, status: 'approved' } });

    const result = group.get({ plain: true });
    result.memberCount = memberCount;
    result.isMember = !!membership;
    result.isPending = !!pending;
    result.isInvited = !!invited;
    result.myRole = membership ? membership.role : (invited ? 'invited' : null);

    return result;
};

const joinGroup = async (groupId, userId) => {
    const group = await Group.findByPk(groupId);
    if (!group) {
        const error = new Error('Group not found.');
        error.statusCode = 404;
        throw error;
    }

    const existing = await GroupMember.findOne({ where: { groupId, userId } });
    if (existing) {
        const error = new Error(existing.status === 'approved' ? 'You are already a member.' : 'Your request is pending.');
        error.statusCode = 400;
        throw error;
    }

    await GroupMember.create({ groupId, userId, role: 'member', status: 'pending' });
    return { message: 'Join request sent successfully.' };
};

const approveOrReject = async (groupId, adminId, memberId, action) => {
    // Verify admin
    const adminMember = await GroupMember.findOne({ where: { groupId, userId: adminId, role: 'admin', status: 'approved' } });
    if (!adminMember) {
        const error = new Error('Only group admins can manage members.');
        error.statusCode = 403;
        throw error;
    }

    const member = await GroupMember.findOne({ where: { groupId, userId: memberId, status: 'pending' } });
    if (!member) {
        const error = new Error('Pending member not found.');
        error.statusCode = 404;
        throw error;
    }

    if (action === 'approve') {
        await member.update({ status: 'approved' });
        return { message: 'Member approved.' };
    } else {
        await member.destroy();
        return { message: 'Member request rejected.' };
    }
};


const getGroupMembers = async (groupId, requesterId) => {
    // Verify membership
    const requester = await GroupMember.findOne({ where: { groupId, userId: requesterId, status: 'approved' } });
    if (!requester) {
        const error = new Error('You must be a member to view the member list.');
        error.statusCode = 403;
        throw error;
    }

    const members = await GroupMember.findAll({
        where: {
            groupId,
            status: 'approved'
        },
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
        order: [['role', 'ASC'], ['createdAt', 'ASC']],
    });
    return members;
};

const getGroupPosts = async (groupId, userId, query) => {
    // Verify membership
    const membership = await GroupMember.findOne({ where: { groupId, userId, status: 'approved' } });
    if (!membership) {
        const error = new Error('You must be a member to view group posts.');
        error.statusCode = 403;
        throw error;
    }

    const { page, limit, offset } = paginate(query);
    const { count, rows } = await Post.findAndCountAll({
        where: { groupId, status: 'published' },
        include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });

    return paginatedResult(rows, count, page, limit);
};

const createGroupPost = async (groupId, userId, { title, content, coverImage, tags }) => {
    // Verify membership
    const membership = await GroupMember.findOne({ where: { groupId, userId, status: 'approved' } });
    if (!membership) {
        const error = new Error('You must be a member to post in this group.');
        error.statusCode = 403;
        throw error;
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
    const post = await Post.create({ title, slug, content, coverImage, tags, status: 'published', userId, groupId });
    return post;
};

const leaveGroup = async (groupId, userId) => {
    const membership = await GroupMember.findOne({ where: { groupId, userId } });
    if (!membership) {
        const error = new Error('You are not a member of this group.');
        error.statusCode = 400;
        throw error;
    }

    if (membership.role === 'admin') {
        const error = new Error('Group admins cannot leave. Delete the group instead.');
        error.statusCode = 400;
        throw error;
    }

    await membership.destroy();
    return { message: 'You have left the group.' };
};

const deleteGroup = async (groupId, userId) => {
    const group = await Group.findByPk(groupId);
    if (!group) {
        const error = new Error('Group not found.');
        error.statusCode = 404;
        throw error;
    }

    if (group.creatorId !== userId) {
        const error = new Error('Only the group creator can delete the group.');
        error.statusCode = 403;
        throw error;
    }

    await GroupMember.destroy({ where: { groupId } });
    await Post.destroy({ where: { groupId } });
    await group.destroy();
    return { message: 'Group deleted successfully.' };
};

const inviteUser = async (groupId, adminId, userId) => {
    // Verify admin
    const adminMember = await GroupMember.findOne({ where: { groupId, userId: adminId, role: 'admin', status: 'approved' } });
    if (!adminMember) {
        const error = new Error('Only group admins can invite members.');
        error.statusCode = 403;
        throw error;
    }

    const existing = await GroupMember.findOne({ where: { groupId, userId } });
    if (existing) {
        const error = new Error('User is already a member or has a pending request/invite.');
        error.statusCode = 400;
        throw error;
    }

    await GroupMember.create({ groupId, userId, role: 'member', status: 'invited' });
    return { message: 'Invitation sent successfully.' };
};

const getInviteSuggestions = async (groupId, userId) => {
    // We want followers of userId who are not in the group
    const user = await User.findByPk(userId, {
        include: [{
            model: User,
            as: 'followers',
            attributes: ['id', 'username', 'avatar'],
            through: { attributes: [] }
        }]
    });

    const followers = user.followers || [];
    const groupMembers = await GroupMember.findAll({ where: { groupId }, attributes: ['userId'] });
    const memberIds = groupMembers.map(m => m.userId);

    return followers.filter(f => !memberIds.includes(f.id));
};

const acceptInvite = async (groupId, userId) => {
    const invite = await GroupMember.findOne({ where: { groupId, userId, status: 'invited' } });
    if (!invite) {
        const error = new Error('Invitation not found.');
        error.statusCode = 404;
        throw error;
    }

    await invite.update({ status: 'approved' });
    return { message: 'Invitation accepted.' };
};

const rejectInvite = async (groupId, userId) => {
    const invite = await GroupMember.findOne({ where: { groupId, userId, status: 'invited' } });
    if (!invite) {
        const error = new Error('Invitation not found.');
        error.statusCode = 404;
        throw error;
    }

    await invite.destroy();
    return { message: 'Invitation rejected.' };
};

const getMyInvites = async (userId) => {
    const invites = await GroupMember.findAll({
        where: { userId, status: 'invited' },
        include: [
            {
                model: Group,
                as: 'group',
                include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'avatar'] }]
            }
        ],
        order: [['createdAt', 'DESC']]
    });
    return invites.map(i => i.group);
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
