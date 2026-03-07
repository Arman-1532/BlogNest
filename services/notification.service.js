const { Notification, User, Post } = require('../models');
const { paginate, paginatedResult } = require('../utils/pagination');

const getUserNotifications = async (userId, query) => {
  const { page, limit, offset } = paginate(query);

  const { count, rows } = await Notification.findAndCountAll({
    where: { userId },
    include: [
      { model: User, as: 'fromUser', attributes: ['id', 'username', 'avatar'] },
      { model: Post, as: 'post', attributes: ['id', 'title', 'slug'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return paginatedResult(rows, count, page, limit);
};

const getUnreadCount = async (userId) => {
  const count = await Notification.count({ where: { userId, isRead: false } });
  return { unreadCount: count };
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findByPk(notificationId);

  if (!notification) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  if (notification.userId !== userId) {
    const error = new Error('Not authorized.');
    error.statusCode = 403;
    throw error;
  }

  await notification.update({ isRead: true });
  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
  return { message: 'All notifications marked as read.' };
};

const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findByPk(notificationId);

  if (!notification) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  if (notification.userId !== userId) {
    const error = new Error('Not authorized.');
    error.statusCode = 403;
    throw error;
  }

  await notification.destroy();
  return { message: 'Notification deleted.' };
};

module.exports = { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };

