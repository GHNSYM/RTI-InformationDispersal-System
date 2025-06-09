const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};

// Add base sequelize instances
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Import models - store the model definitions first
const UserModel = require('../models/User');
const DepartmentModel = require('../models/Departments');
const RtiRequestModel = require('../models/RtiRequest');
const DistrictModel = require('../models/District');
const RtiLogModel = require('../models/RtiLog');
const NotificationModel = require('../models/Notification');

// Initialize models
db.User = UserModel(sequelize, DataTypes);
db.Department = DepartmentModel(sequelize, DataTypes);
db.RtiRequest = RtiRequestModel(sequelize, DataTypes);
db.District = DistrictModel(sequelize, DataTypes);
db.RtiLog = RtiLogModel(sequelize, DataTypes);
db.Notification = NotificationModel(sequelize, DataTypes);

// Set up associations
Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;


