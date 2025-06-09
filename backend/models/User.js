const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '1' // 1: Citizen, 2: Department Admin, 3: SPIO Admin, 4: SPIO Assistant, 5: State Admin
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    district_code: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'master_district',
        key: 'district_code'
      }
    },
    department_code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Instance method to check password
  User.prototype.checkPassword = async function(password) {
    console.log('Checking password:', {
      providedPassword: password,
      storedHash: this.password
    });
    const result = await bcrypt.compare(password, this.password);
    console.log('Password check result:', result);
    return result;
  };

  User.associate = (models) => {
    User.belongsTo(models.District, {
      foreignKey: 'district_code',
      targetKey: 'district_code',
      as: 'district'
    });

    User.hasMany(models.RtiRequest, {
      foreignKey: 'citizen_id',
      sourceKey: 'id',
      as: 'requests'
    });

    // User.hasMany(models.RtiRequest, {
    //   foreignKey: 'assigned_to',
    //   sourceKey: 'id',
    //   as: 'assignedRequests'
    // });

    User.hasMany(models.RtiRequest, {
      foreignKey: 'responded_by',
      sourceKey: 'id',
      as: 'respondedRequests'
    });
  };

  return User;
};