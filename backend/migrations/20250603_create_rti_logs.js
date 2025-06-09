'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First ensure the uuid-ossp extension is available
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Create the enum type
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_rti_logs_action_type AS ENUM (
          'STATUS_CHANGE',
          'ASSIGNMENT',
          'REMARK_ADDED',
          'ATTACHMENT_ADDED',
          'RESPONSE_ADDED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create the table
    await queryInterface.createTable('rti_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      request_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'rti_requests',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      action_type: {
        type: Sequelize.ENUM('STATUS_CHANGE', 'ASSIGNMENT', 'REMARK_ADDED', 'ATTACHMENT_ADDED', 'RESPONSE_ADDED'),
        allowNull: false
      },
      old_value: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      new_value: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      performed_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'NO ACTION'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indices
    await queryInterface.addIndex('rti_logs', ['request_id']);
    await queryInterface.addIndex('rti_logs', ['action_type']);
    await queryInterface.addIndex('rti_logs', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop indices first
    await queryInterface.removeIndex('rti_logs', ['request_id']);
    await queryInterface.removeIndex('rti_logs', ['action_type']);
    await queryInterface.removeIndex('rti_logs', ['created_at']);

    // Drop the table
    await queryInterface.dropTable('rti_logs');

    // Drop the enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_rti_logs_action_type;');
  }
};
