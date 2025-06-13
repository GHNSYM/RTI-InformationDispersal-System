module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('Department', {    
    code: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false
    },
    name_en: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    district_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'master_district',
        key: 'district_code'
      }
    }
  }, {
    tableName: 'departments',
    timestamps: false // assuming there are no created_at/updatedAt columns
  });

  Department.associate = (models) => {
    Department.hasMany(models.RtiRequest, {
      foreignKey: 'department',
      sourceKey: 'code',
      as: 'requests'
    });

    Department.belongsTo(models.District, {
      foreignKey: 'district_code',
      targetKey: 'district_code',
      as: 'district'
    });
  };

  return Department;
};
