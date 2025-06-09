'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns
    await queryInterface.addColumn('rti_requests', 'assigned_to', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    });

    await queryInterface.addColumn('rti_requests', 'review_status', {
      type: Sequelize.ENUM('Pending', 'Reviewed'),
      allowNull: false,
      defaultValue: 'Pending'
    });

    await queryInterface.addColumn('rti_requests', 'assignment_date', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('rti_requests', 'assistant_remarks', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Create index for assigned_to
    await queryInterface.addIndex('rti_requests', ['assigned_to']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index
    await queryInterface.removeIndex('rti_requests', ['assigned_to']);

    // Remove columns
    await queryInterface.removeColumn('rti_requests', 'assigned_to');
    await queryInterface.removeColumn('rti_requests', 'review_status');
    await queryInterface.removeColumn('rti_requests', 'assignment_date');
    await queryInterface.removeColumn('rti_requests', 'assistant_remarks');

    // Drop the enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_rti_requests_review_status;');
  }
}; 