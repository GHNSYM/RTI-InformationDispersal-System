const db = require('../config/database');
const RtiLog = db.RtiLog;

const RequestLogger = {
  // Log status changes
  logStatusChange: async (requestId, oldStatus, newStatus, userId, remarks = null) => {
    return RtiLog.create({
      request_id: requestId,
      action_type: 'STATUS_CHANGE',
      old_value: oldStatus,
      new_value: newStatus,
      remarks: remarks || `Status changed from ${oldStatus || 'none'} to ${newStatus}`,
      performed_by: userId
    });
  },

  // Log assignments
  logAssignment: async (requestId, oldAssignee, newAssignee, userId, remarks = null) => {
    return RtiLog.create({
      request_id: requestId,
      action_type: 'ASSIGNMENT',
      old_value: oldAssignee || 'unassigned',
      new_value: newAssignee,
      remarks: remarks || `Request assigned to assistant ${newAssignee}`,
      performed_by: userId
    });
  },

  // Log remarks
  logRemark: async (requestId, remarks, userId) => {
    return RtiLog.create({
      request_id: requestId,
      action_type: 'REMARK_ADDED',
      new_value: remarks,
      remarks: 'Remark added to request',
      performed_by: userId
    });
  },

  // Log attachment additions
  logAttachment: async (requestId, fileName, userId, isResponse = false) => {
    return RtiLog.create({
      request_id: requestId,
      action_type: 'ATTACHMENT_ADDED',
      new_value: fileName,
      remarks: isResponse ? 'Response file added' : 'Request attachment added',
      performed_by: userId
    });
  },

  // Log response additions
  logResponse: async (requestId, responseText, userId) => {
    return RtiLog.create({
      request_id: requestId,
      action_type: 'RESPONSE_ADDED',
      new_value: responseText,
      remarks: 'Response added to request',
      performed_by: userId
    });
  },

  // Get logs for a request
  getRequestLogs: async (requestId, options = {}) => {
    return RtiLog.findAll({
      where: { request_id: requestId },
      include: [{
        model: db.User,
        as: 'actor',
        attributes: ['id', 'name', 'email', 'role']
      }],
      order: [['created_at', 'DESC']],
      ...options
    });
  }
};

module.exports = RequestLogger;
