const db = require('../config/database');
const { Notification, User } = db;

class NotificationService {
  static async createNotification({
    userId,
    via = 'app',
    message,
    requestId = null,
    logId = null,
    notificationType
  }) {
    try {
      const notification = await Notification.create({
        user_id: userId,
        via,
        message,
        request_id: requestId,
        log_id: logId,
        notification_type: notificationType,
        sent_at: new Date(),
        status: 'sent'
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId) {
    try {
      const notifications = await Notification.findAll({
        where: { user_id: userId },
        order: [['sent_at', 'DESC']],
        include: [
          {
            model: db.RtiRequest,
            as: 'request',
            attributes: ['id', 'subject', 'status']
          }
        ]
      });

      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { id: notificationId, user_id: userId }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.update({ status: 'read' });
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      await Notification.update(
        { status: 'read' },
        { where: { user_id: userId, status: 'sent' } }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

module.exports = NotificationService; 