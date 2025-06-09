const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { RtiRequest, Department, User, District, RtiLog } = db;
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all requests with department details for state admin
router.get('/all-requests', auth, async (req, res, next) => {
  try {
    // Only State Admin (role "5") can access this
    if (req.user.role !== "5") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const requests = await RtiRequest.findAll({
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

    const formattedRequests = requests.map(request => ({
      id: request.id,
      subject: request.subject,
      status: request.status,
      date: new Date(request.created_at).toLocaleDateString(),
      department: request.departmentDetails?.name_en || request.department,
      department_code: request.department,
      citizen: request.citizen,
      file_name: request.file_name,
      created_at: request.created_at
    }));

    res.json(formattedRequests);
  } catch (err) {
    console.error('Error in /all-requests:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get detailed information for a single request
router.get('/request/:id', auth, async (req, res, next) => {
  try {
    // Only State Admin (role "5") can access this
    if (req.user.role !== "5") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Find request with all details
    const request = await RtiRequest.findOne({
      where: { id: req.params.id },
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

    const response = {
      id: request.id,
      subject: request.subject,
      description: request.description,
      status: request.status,
      date: new Date(request.created_at).toLocaleDateString(),
      file_name: request.file_name,
      department: request.departmentDetails?.name_en || request.department,
      department_code: request.department,
      citizen: request.citizen,
      hasAttachment: !!request.file_name,
      rejection_reason: request.rejection_reason
    };

    res.json(response);
  } catch (err) {
    console.error('Error in /request/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all logs for a request
router.get('/request/:id/logs', auth, async (req, res, next) => {
  try {
    // Only State Admin (role "5") can access this
    if (req.user.role !== "5") {
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

// Reset SPIO password
router.put('/spio/:id/reset-password', auth, async (req, res) => {
  try {
    // Only State Admin (role "5") can reset SPIO passwords
    if (req.user.role !== "5") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { new_password, reactivate } = req.body;
    if (!new_password) {
      return res.status(400).json({ error: 'New password is required' });
    }

    // Find the SPIO
    const spio = await User.findOne({
      where: {
        id: req.params.id,
        role: '3' // SPIO role
      }
    });

    if (!spio) {
      return res.status(404).json({ error: 'SPIO not found' });
    }

    // Update the password and reactivate if requested
    await spio.update({
      password: new_password,
      active: true // Always reactivate when password is reset
    });

    res.json({ message: 'Password reset and account reactivated successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
