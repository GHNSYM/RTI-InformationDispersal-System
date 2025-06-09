module.exports = (sequelize, DataTypes) => {
  const District = sequelize.define('District', {
    state_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    district_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    state_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    district_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    district_code: {
      type: DataTypes.STRING(10),
      allowNull: false
    }
  }, {
    tableName: 'master_district',
    timestamps: false
  });

  return District;
}; 