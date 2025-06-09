const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { User, RtiRequest, Department, RtiLog } = db;
const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const RequestLogger = require('../utils/requestLogger');

// Get detailed information for a single request
router.get('/request/:id', auth, async (req, res, next) => {
  try {
    // Only SPIO (role "3") can access this
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Find request with basic details
    const request = await RtiRequest.findOne({
      where: { 
        id: req.params.id,
        department: {
          [Op.like]: `${req.user.district_code}%`
        }
      },
      include: [
        {
          model: User,
          as: 'citizen',
          attributes: ['name', 'email', 'phone']
        },
        {
          model: Department,
          as: 'departmentDetails',
          attributes: ['name_en', 'code']
        }
      ]
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Get the latest assignment log
    const latestAssignment = await RtiLog.findOne({
      where: {
        request_id: request.id,
        action_type: 'ASSIGNMENT'
      },
      include: [{
        model: User,
        as: 'actor',
        attributes: ['name', 'email', 'phone']
      }],
      order: [['created_at', 'DESC']]
    });

    // Get the latest remark log
    const latestRemark = await RtiLog.findOne({
      where: {
        request_id: request.id,
        action_type: 'REMARK_ADDED'
      },
      order: [['created_at', 'DESC']]
    });

    const response = {
      id: request.id,
      subject: request.subject,
      description: request.description,
      status: request.status,
      date: new Date(request.created_at).toLocaleDateString(),
      file_name: request.file_name,
      department: {
        code: request.department,
        name_en: request.departmentDetails?.name_en
      },
      citizen: request.citizen,
      hasAttachment: !!request.file_name,
      rejection_reason: request.rejection_reason,
      assignedAssistant: latestAssignment?.actor || null,
      assistant_remarks: latestRemark?.new_value || null
    };

    res.json(response);
  } catch (err) {
    console.error('Error in /request/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// Download attachment
router.get('/request/:id/attachment', auth, async (req, res, next) => {
  try {
    // Only SPIO (role "3") can access this
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const request = await RtiRequest.findOne({
      where: { 
        id: req.params.id,
        department: {
          [Op.like]: `${req.user.district_code}%`
        }
      },
      attributes: ['attachment', 'file_name']
    });

    if (!request || !request.attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${request.file_name}"`,
    });

    res.send(request.attachment);
  } catch (err) {
    next(err);
  }
});

// Get statistics for SPIO's district
router.get('/stats', auth, async (req, res, next) => {
  try {
    // Only SPIO (role "3") can access this
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Get departments in SPIO's district
    const departmentsInDistrict = await Department.findAll({
      where: {
        code: {
          [Op.like]: `${req.user.district_code}%`
        }
      },
      attributes: ['code']
    });
    
    const departmentCodes = departmentsInDistrict.map(dept => dept.code);

    if (departmentCodes.length === 0) {
      return res.json({
        total: 0,
        processingRequests: 0,
        ApprovedRequests: 0,
        RejectedRequests: 0,
        PendingRequests: 0
      });
    }

    const stats = await RtiRequest.findAll({
      where: {
        department: {
          [Op.in]: departmentCodes
        }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total'],
        [db.sequelize.fn('COUNT', db.sequelize.literal('CASE WHEN status = \'Processing\' THEN 1 END')), 'processingRequests'],
        [db.sequelize.fn('COUNT', db.sequelize.literal('CASE WHEN status = \'Approved\' THEN 1 END')), 'ApprovedRequests'],
        [db.sequelize.fn('COUNT', db.sequelize.literal('CASE WHEN status = \'Rejected\' THEN 1 END')), 'RejectedRequests'],
        [db.sequelize.fn('COUNT', db.sequelize.literal('CASE WHEN status = \'Pending\' THEN 1 END')), 'PendingRequests']
      ],
      raw: true
    });

    res.json(stats[0] || {
      total: 0,
      processingRequests: 0,
      ApprovedRequests: 0,
      RejectedRequests: 0,
      PendingRequests: 0
    });
  } catch (err) {
    console.error('Error in /stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all requests for SPIO's district
router.get('/all-requests', auth, async (req, res, next) => {
  try {
    // Only SPIO (role "3") can access this
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Get departments in SPIO's district
    const departmentsInDistrict = await Department.findAll({
      where: {
        code: {
          [Op.like]: `${req.user.district_code}%`
        }
      },
      attributes: ['code']
    });
    
    const departmentCodes = departmentsInDistrict.map(dept => dept.code);

    if (departmentCodes.length === 0) {
      return res.json([]);
    }

    const requests = await RtiRequest.findAll({
      where: {
        department: {
          [Op.in]: departmentCodes
        }
      },
      include: [
        {
          model: User,
          as: 'citizen',
          attributes: ['name', 'email', 'phone']
        },
        {
          model: Department,
          as: 'departmentDetails',
          attributes: ['name_en', 'code']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Get all assignments and remarks in one query
    const requestIds = requests.map(r => r.id);
    const logs = await RtiLog.findAll({
      where: {
        request_id: requestIds,
        action_type: {
          [Op.in]: ['ASSIGNMENT', 'REMARK_ADDED']
        }
      },
      include: [{
        model: User,
        as: 'actor',
        attributes: ['id', 'name', 'email', 'phone']
      }],
      order: [['created_at', 'DESC']]
    });

    // Group logs by request_id
    const logsByRequest = logs.reduce((acc, log) => {
      if (!acc[log.request_id]) {
        acc[log.request_id] = {
          assignment: null,
          remark: null
        };
      }
      if (log.action_type === 'ASSIGNMENT' && !acc[log.request_id].assignment) {
        acc[log.request_id].assignment = log;
      } else if (log.action_type === 'REMARK_ADDED' && !acc[log.request_id].remark) {
        acc[log.request_id].remark = log;
      }
      return acc;
    }, {});

    // Get all assigned assistant IDs
    const assignedAssistantIds = Object.values(logsByRequest)
      .filter(log => log.assignment)
      .map(log => log.assignment.new_value);

    // Fetch all assigned assistants
    const assignedAssistants = await User.findAll({
      where: {
        id: {
          [Op.in]: assignedAssistantIds
        }
      },
      attributes: ['id', 'name', 'email', 'phone']
    });

    // Create a map of assistant IDs to their details
    const assistantMap = assignedAssistants.reduce((acc, assistant) => {
      acc[assistant.id] = assistant;
      return acc;
    }, {});

    const formattedRequests = requests.map(request => {
      const assignmentLog = logsByRequest[request.id]?.assignment;
      const remarkLog = logsByRequest[request.id]?.remark;
      const assignedAssistant = assignmentLog ? assistantMap[assignmentLog.new_value] : null;

      console.log('Processing request:', {
        id: request.id,
        assignmentLog,
        remarkLog,
        assignedAssistant
      });

      const formatted = {
        id: request.id,
        subject: request.subject,
        status: request.status,
        date: new Date(request.created_at).toLocaleDateString(),
        department: request.departmentDetails?.name_en || request.department,
        department_code: request.department,
        citizen: request.citizen,
        file_name: request.file_name,
        assigned_to: assignedAssistant ? {
          id: assignedAssistant.id,
          name: assignedAssistant.name,
          email: assignedAssistant.email,
          phone: assignedAssistant.phone
        } : null,
        review_status: remarkLog?.new_value ? 'reviewed' : (assignedAssistant ? 'pending' : null),
        assistant_remarks: remarkLog?.new_value || null
      };

      console.log('Formatted request:', formatted);
      return formatted;
    });

    res.json(formattedRequests);
  } catch (err) {
    console.error('Error in /all-requests:', err);
    res.status(500).json({ error: err.message });
  }
});

// Forward a request
router.put('/request/:id/forward', auth, async (req, res, next) => {
  try {
    // Only SPIO (role "3") can access this
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const request = await RtiRequest.findOne({ 
      where: { 
        id: req.params.id,
        department: {
          [Op.like]: `${req.user.district_code}%`
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const oldStatus = request.status;
    // Update the status to Processing
    await request.update({ status: 'Processing' });

    // Log the status change
    await RequestLogger.logStatusChange(
      request.id,
      oldStatus,
      'Processing',
      req.user.id,
      'Request forwarded by SPIO'
    );

    res.json({ message: 'Request forwarded successfully' });
  } catch (err) {
    next(err);
  }
});

// Get all assistants for the SPIO's district
router.get('/assistants', auth, async (req, res, next) => {
  try {
    // Only SPIO (role "3") can access this
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const assistants = await User.findAll({
      where: {
        role: '4', // Assistant role
        district_code: req.user.district_code
      },
      attributes: { exclude: ['password'] }
    });

    res.json(assistants);
  } catch (err) {
    next(err);
  }
});

// Add a new assistant
router.post('/assistants', auth, async (req, res, next) => {
  try {
    // Only SPIO (role "3") can add assistants
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { name, email, phone, password, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new assistant
    const assistant = await User.create({
      name,
      email,
      phone,
      password: password,
      address,
      role: '4', // Assistant role
      district_code: req.user.district_code // Same district as SPIO
    });

    // Return assistant without password
    const { password: _, ...assistantWithoutPassword } = assistant.toJSON();
    res.status(201).json(assistantWithoutPassword);
  } catch (err) {
    next(err);
  }
});

// Remove an assistant
router.delete('/assistants/:id', auth, async (req, res, next) => {
  try {
    // Only SPIO (role "3") can remove assistants
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const assistant = await User.findOne({
      where: {
        id: req.params.id,
        role: '4',
        district_code: req.user.district_code
      }
    });

    if (!assistant) {
      return res.status(404).json({ error: 'Assistant not found' });
    }

    await assistant.destroy();
    res.json({ message: 'Assistant removed successfully' });
  } catch (err) {
    next(err);
  }
});

// Update an assistant
router.put('/assistants/:id', auth, async (req, res, next) => {
  try {
    // Only SPIO (role "3") can update assistants
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { name, email, phone, address } = req.body;

    const assistant = await User.findOne({
      where: {
        id: req.params.id,
        role: '4',
        district_code: req.user.district_code
      }
    });

    if (!assistant) {
      return res.status(404).json({ error: 'Assistant not found' });
    }

    // Update assistant details
    await assistant.update({
      name,
      email,
      phone,
      address
    });

    // Return updated assistant without password
    const { password: _, ...assistantWithoutPassword } = assistant.toJSON();
    res.json(assistantWithoutPassword);
  } catch (err) {
    next(err);
  }
});

// Assign a request to an assistant
router.post('/request/:id/assign', auth, async (req, res, next) => {
  try {
    // Only SPIO (role "3") can access this
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { assistant_id, remarks } = req.body;

    // Verify the assistant exists and belongs to SPIO's district
    const assistant = await User.findOne({
      where: {
        id: assistant_id,
        role: '4', // Assistant role
        district_code: req.user.district_code
      }
    });

    if (!assistant) {
      return res.status(404).json({ error: 'Assistant not found' });
    }

    // Find the request
    const request = await RtiRequest.findOne({
      where: { 
        id: req.params.id,
        department: {
          [Op.like]: `${req.user.district_code}%`
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Create assignment log
    await RtiLog.create({
      request_id: request.id,
      action_type: 'ASSIGNMENT',
      new_value: assistant_id.toString(),
      remarks: 'Queued for verification',
      performed_by: req.user.id
    });

    // If there are additional remarks, create a remark log
    if (remarks) {
      await RtiLog.create({
        request_id: request.id,
        action_type: 'REMARK_ADDED',
        new_value: remarks,
        performed_by: req.user.id
      });
    }

    res.json({ message: 'Request assigned successfully' });
  } catch (err) {
    console.error('Error in /request/:id/assign:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all logs for a request
router.get('/request/:id/logs', auth, async (req, res, next) => {
  try {
    // Only SPIO (role "3") can access this
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const logs = await RtiLog.findAll({
      where: { request_id: req.params.id },
      include: [{
        model: User,
        as: 'actor',
        attributes: ['name', 'email', 'phone']
      }],
      order: [['created_at', 'ASC']]
    });

    res.json(logs);
  } catch (err) {
    console.error('Error in /request/:id/logs:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
