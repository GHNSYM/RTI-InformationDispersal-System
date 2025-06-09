module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    via: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['email', 'sms', 'app']] // Possible notification channels
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'sent',
      validate: {
        isIn: [['sent', 'read']]
      }
    },
    // Additional fields to support different notification types
    request_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: 'rti_requests',
        key: 'id'
      }
    },
    log_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: 'rti_logs',
        key: 'id'
      }
    },
    notification_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [
          'REQUEST_CREATED',
          'STATUS_CHANGED',
          'REQUEST_ASSIGNED',
          'REMARK_ADDED',
          'REQUEST_FORWARDED'
        ]
      }
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'sent_at',
    updatedAt: false
  });

  Notification.associate = (models) => {
    // Association with User
    Notification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'recipient'
    });

    // Association with RtiRequest
    Notification.belongsTo(models.RtiRequest, {
      foreignKey: 'request_id',
      as: 'request'
    });

    // Association with RtiLog
    Notification.belongsTo(models.RtiLog, {
      foreignKey: 'log_id',
      as: 'log'
    });
  };

  return Notification;
}; 