const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { User, RtiRequest, Department, RtiLog } = db;
const auth = require('../middleware/auth');
const { Op } = require('sequelize');
const RequestLogger = require('../utils/requestLogger');

// Get assigned requests for assistant
router.get('/assigned-requests', auth, async (req, res, next) => {
  try {
    // Only SPIO Assistants (role "4") can access this
    if (req.user.role !== "4") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Get all requests assigned to this assistant
    const requests = await RtiRequest.findAll({
      where: {
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
        },
        [Op.or]: [
          {
            action_type: 'ASSIGNMENT',
            new_value: req.user.id.toString()
          },
          {
            action_type: 'REMARK_ADDED',
            performed_by: req.user.id
          }
        ]
      },
      include: [{
        model: User,
        as: 'actor',
        attributes: ['name', 'email', 'phone']
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

    // Filter requests to only include those assigned to this assistant
    const assignedRequests = requests.filter(request => logsByRequest[request.id]?.assignment);

    // Get statistics
    const stats = {
      totalAssigned: assignedRequests.length,
      pendingReview: assignedRequests.filter(request => !logsByRequest[request.id]?.remark).length,
      reviewed: assignedRequests.filter(request => logsByRequest[request.id]?.remark).length
    };

    const formattedRequests = assignedRequests.map(request => ({
      id: request.id,
      subject: request.subject,
      status: request.status,
      date: new Date(request.created_at).toLocaleDateString(),
      department: request.departmentDetails?.name_en || request.department,
      department_code: request.department,
      citizen: request.citizen,
      file_name: request.file_name,
      assistant_remarks: logsByRequest[request.id]?.remark?.new_value || null
    }));

    res.json({
      requests: formattedRequests,
      ...stats
    });
  } catch (err) {
    console.error('Error in /assigned-requests:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get detailed information for a single request
router.get('/request/:id', auth, async (req, res, next) => {
  try {
    // Only SPIO Assistants (role "4") can access this
    if (req.user.role !== "4") {
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

    // Verify this request is assigned to this assistant
    const assignmentLog = await RtiLog.findOne({
      where: {
        request_id: request.id,
        action_type: 'ASSIGNMENT',
        new_value: req.user.id.toString()
      }
    });

    if (!assignmentLog) {
      return res.status(403).json({ error: 'This request is not assigned to you' });
    }

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
    // Only SPIO Assistants (role "4") can access this
    if (req.user.role !== "4") {
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

    // Verify this request is assigned to this assistant
    const assignmentLog = await RtiLog.findOne({
      where: {
        request_id: request.id,
        action_type: 'ASSIGNMENT',
        new_value: req.user.id.toString()
      }
    });

    if (!assignmentLog) {
      return res.status(403).json({ error: 'This request is not assigned to you' });
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

// Submit review for assigned request
router.put('/request/:id/review', auth, async (req, res, next) => {
  try {
    // Only SPIO Assistants (role "4") can access this
    if (req.user.role !== "4") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { remarks, verification_status } = req.body;

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

    // Verify this request is assigned to this assistant
    const assignmentLog = await RtiLog.findOne({
      where: {
        request_id: request.id,
        action_type: 'ASSIGNMENT',
        new_value: req.user.id.toString()
      }
    });

    if (!assignmentLog) {
      return res.status(403).json({ error: 'This request is not assigned to you' });
    }

    // Create remark log with verification status
    await RtiLog.create({
      request_id: request.id,
      action_type: 'REMARK_ADDED',
      new_value: remarks,
      remarks: `Verification Status: ${verification_status}. ${remarks ? `Additional Remarks: ${remarks}` : ''}`,
      performed_by: req.user.id
    });

    // Log the status change if verification status is provided
    if (verification_status) {
      await RequestLogger.logStatusChange(
        request.id,
        request.status,
        request.status,
        req.user.id,
        `Verification completed with status: ${verification_status}`
      );
    }

    res.json({ message: 'Review submitted successfully' });
  } catch (err) {
    console.error('Error in /request/:id/review:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
