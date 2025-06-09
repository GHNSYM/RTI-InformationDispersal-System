module.exports = (sequelize, DataTypes) => {
  const RtiRequest = sequelize.define('RtiRequest', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    citizen_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'code'
      }
    },
    subject: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Processing'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    attachment: {
      type: DataTypes.BLOB('long'),
      allowNull: true,
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    response_file: {
      type: DataTypes.BLOB('long'),
      allowNull: true
    },
    response_file_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    response_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    responded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'rti_requests',
    timestamps: false
  });

  RtiRequest.associate = (models) => {
    RtiRequest.belongsTo(models.User, {
      foreignKey: 'citizen_id',
      targetKey: 'id',
      as: 'citizen'
    });

    RtiRequest.belongsTo(models.Department, {
      foreignKey: 'department',
      targetKey: 'code',
      as: 'departmentDetails'
    });

    RtiRequest.belongsTo(models.User, {
      foreignKey: 'responded_by',
      targetKey: 'id',
      as: 'responder'
    });

    if (models.RtiLog) {
      RtiRequest.hasMany(models.RtiLog, {
        foreignKey: 'request_id',
        sourceKey: 'id',
        as: 'logs'
      });
    }
  };

  return RtiRequest;
};

