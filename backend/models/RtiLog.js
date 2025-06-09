const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RtiLog extends Model {
    static associate(models) {
      RtiLog.belongsTo(models.RtiRequest, {
        foreignKey: 'request_id',
        targetKey: 'id',
        as: 'request'
      });
      RtiLog.belongsTo(models.User, {
        foreignKey: 'performed_by',
        targetKey: 'id',
        as: 'actor'
      });
    }
  }
  
  RtiLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    request_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'rti_requests',
        key: 'id'
      }
    },
    action_type: {
      type: DataTypes.ENUM(
        'STATUS_CHANGE',
        'ASSIGNMENT',
        'REMARK_ADDED',
        'ATTACHMENT_ADDED',
        'RESPONSE_ADDED'
      ),
      allowNull: false
    },
    old_value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    new_value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    performed_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }  }, {
    sequelize,
    modelName: 'RtiLog',
    tableName: 'rti_logs',
    timestamps: false
  });

  return RtiLog;
};
