const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../config/database');
const { RtiRequest, Department, User, sequelize, RtiLog } = db;
const auth = require('../middleware/auth');
const { Op } = require('sequelize');
const RequestLogger = require('../utils/requestLogger');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow pdf, doc, docx
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordProcessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOC files are allowed.'));
    }
  }
});

// Get department information
router.get('/info', auth, async (req, res, next) => {
  try {
    const departmentCode = req.user.department_code;
    console.log('Fetching department info for:', departmentCode); // Debug log

    const department = await Department.findOne({
      where: { code: departmentCode.toString() },
      attributes: ['code', 'name_en']
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({
      code: department.code,
      name_en: department.name_en
    });
  } catch (err) {
    console.error('Error fetching department info:', err);
    next(err);
  }
});

// Get department statistics
router.get('/stats', auth, async (req, res, next) => {
  try {
    const departmentCode = req.user.department_code;
    console.log('Fetching stats for department:', departmentCode); // Debug log
    
    // Use Sequelize instead of raw SQL for better compatibility
    const stats = await RtiRequest.findAll({
      where: { 
        department: departmentCode.toString() // Convert to string to match the column type
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'Processing\' THEN 1 END')), 'processingRequests'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'Approved\' THEN 1 END')), 'approvedRequests'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'Rejected\' THEN 1 END')), 'rejectedRequests'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'Pending\' THEN 1 END')), 'pendingRequests']
      ],
      raw: true
    });

    console.log('Stats result:', stats[0]); // Debug log
    res.json(stats[0]);
  } catch (err) {
    console.error('Error fetching department stats:', err);
    next(err);
  }
});

// Get all requests for the department
router.get('/requests', auth, async (req, res, next) => {
  try {
    const departmentCode = req.user.department_code;
    console.log('Fetching requests for department:', departmentCode); // Debug log
    
    const requests = await RtiRequest.findAll({
      where: { 
        department: departmentCode.toString(),
        status: { [Op.not]: 'Pending' } // Convert to string to match the column type
      },
      order: [['created_at', 'DESC']],
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

    console.log('Found requests:', requests.length); // Debug log

    const formattedRequests = requests.map(request => ({
      id: request.id,
      subject: request.subject,
      description: request.description,
      status: request.status,
      date: new Date(request.created_at).toLocaleDateString(),
      file_name: request.file_name,
      hasAttachment: !!request.file_name,
      citizen: request.citizen,
      department: request.departmentDetails ? {
        code: request.department,
        name_en: request.departmentDetails.name_en
      } : null
    }));

    res.json(formattedRequests);
  } catch (err) {
    console.error('Error fetching department requests:', err);
    next(err);
  }
});

// Get single request details
router.get('/request/:id', auth, async (req, res, next) => {
  try {
    const departmentCode = req.user.department_code;
    console.log('Fetching request details for department:', departmentCode); // Debug log

    const request = await RtiRequest.findOne({
      where: { 
        id: req.params.id,
        department: departmentCode.toString() // Convert to string to match the column type
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

    const response = {
      id: request.id,
      subject: request.subject,
      description: request.description,
      status: request.status,
      date: new Date(request.created_at).toLocaleDateString(),
      file_name: request.file_name,
      hasAttachment: !!request.file_name,
      rejection_reason: request.rejection_reason,
      department: {
        code: request.department,
        name_en: request.departmentDetails.name_en
      },
      citizen: request.citizen,
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching request details:', err);
    next(err);
  }
});

// Approve request with document attachment
router.put('/request/:id/approve', auth, upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Document attachment is required' });
    }

    const departmentCode = req.user.department_code;
    console.log('Approving request for department:', departmentCode);

    const request = await RtiRequest.findOne({
      where: { 
        id: req.params.id,
        department: departmentCode.toString(),
        status: 'Processing'
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found or cannot be approved' });
    }

    const oldStatus = request.status;

    // Update request with file and status
    await request.update({
      status: 'Approved',
      response_file: req.file.buffer,
      response_file_name: req.file.originalname,
      response_date: new Date(),
      responded_by: req.user.id
    });

    // First log the response file
    await RequestLogger.logAttachment(
      request.id,
      req.file.originalname,
      req.user.id,
      true // isResponse = true
    );

    // Then log the status change
    await RequestLogger.logStatusChange(
      request.id,
      oldStatus,
      'Approved',
      req.user.id,
      'Request approved with response document'
    );

    res.json({ message: 'Request approved successfully' });
  } catch (err) {
    console.error('Error approving request:', err);
    next(err);
  }
});

// Reject request with justification
router.put('/request/:id/reject', auth, upload.none(), async (req, res, next) => {
  try {
    const { justification } = req.body;
    const departmentCode = req.user.department_code;
    console.log('Rejecting request for department:', departmentCode);
    console.log('Justification:', justification);

    if (!justification || !justification.trim()) {
      return res.status(400).json({ error: 'Justification is required' });
    }

    const request = await RtiRequest.findOne({
      where: { 
        id: req.params.id,
        department: departmentCode.toString(),
        status: 'Processing'
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found or cannot be rejected' });
    }

    const oldStatus = request.status;

    // Update request with rejection reason and status
    await request.update({
      status: 'Rejected',
      rejection_reason: justification.trim(),
      response_date: new Date(),
      responded_by: req.user.id
    });

    // First log the rejection reason
    await RequestLogger.logResponse(
      request.id,
      justification.trim(),
      req.user.id
    );

    // Then log the status change
    await RequestLogger.logStatusChange(
      request.id,
      oldStatus,
      'Rejected',
      req.user.id,
      'Request rejected with justification'
    );

    res.json({ message: 'Request rejected successfully' });
  } catch (err) {
    console.error('Error rejecting request:', err);
    next(err);
  }
});

// Download request attachment
router.get('/request/:id/attachment', auth, async (req, res, next) => {
  try {
    const departmentCode = req.user.department_code;
    console.log('Downloading attachment for department:', departmentCode); // Debug log

    const request = await RtiRequest.findOne({
      where: { 
        id: req.params.id,
        department: departmentCode.toString() // Convert to string to match the column type
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
    console.error('Error downloading attachment:', err);
    next(err);
  }
});

module.exports = router;
