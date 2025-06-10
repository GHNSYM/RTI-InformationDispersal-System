const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const db = require('../config/database');
const { RtiRequest, Department, RtiLog, User } = db;
const auth = require('../middleware/auth');
const { Op } = require('sequelize');
const RequestLogger = require('../utils/requestLogger');
const NotificationService = require('../services/notificationService');

// returns total, Approved, Rejected, Pending counts
router.get('/stats', auth, async (req, res, next) => {
  try {
    const citizenId = req.user.id;

    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE citizen_id = :citizenId AND status = 'Processing')   AS "processingRequests",
        COUNT(*) FILTER (WHERE citizen_id = :citizenId AND status = 'Approved')   AS "ApprovedRequests",
        COUNT(*) FILTER (WHERE citizen_id = :citizenId AND status = 'Rejected')   AS "RejectedRequests",
        COUNT(*) FILTER (WHERE citizen_id = :citizenId AND status = 'Pending')    AS "PendingRequests"
      FROM rti_requests;
    `;    const [results] = await db.sequelize.query(sql, {
      replacements: { citizenId },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// returns the 10 most recent requests for this user
router.get('/recent-requests', auth, async (req, res, next) => {
  try {
    const citizenId = req.user.id;
    
    const requests = await RtiRequest.findAll({
      where: { citizen_id: citizenId },
      order: [['created_at', 'DESC']],
      limit: 10,
      attributes: ['id', 'subject', 'status', 'created_at','file_name'],
      raw: true // This ensures plain objects are returned
    });

    // Transform dates and format response
    const formattedRequests = requests.map(request => ({
      id: request.id,
      subject: request.subject,
      status: request.status,
      date: new Date(request.created_at).toLocaleDateString(),
      file_name: request.file_name
    }));

    res.json(formattedRequests); // Send array directly
  } catch (err) {
    next(err);
  }
});


// returns all requests for this user
router.get('/all-requests', auth, async (req, res, next) => {
  try {
    const citizenId = req.user.id;
    
    const requests = await RtiRequest.findAll({
      where: { citizen_id: citizenId },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'subject', 'status', 'created_at','file_name'],
      raw: true // This ensures plain objects are returned
    });

    // Transform dates and format response
    const formattedRequests = requests.map(request => ({
      id: request.id,
      subject: request.subject,
      status: request.status,
      date: new Date(request.created_at).toLocaleDateString(),
      file_name: request.file_name
    }));

    res.json(formattedRequests); // Send array directly
  } catch (err) {
    next(err);
  }
});


// Configure multer with better options and error handling
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

router.post('/new-request', auth, upload.single('attachment'), async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { department, subject, description } = req.body;
    console.log('File received:', req.file); // Debug log
    console.log('Request body:', req.body); // Debug log

    // Generate custom ID: DEPT-YYYYMMDD-COUNTER
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
                   (today.getMonth() + 1).toString().padStart(2, '0') +
                   today.getDate().toString().padStart(2, '0');
    
    // Get the last request ID for this department today
    const lastRequest = await RtiRequest.findOne({
      where: {
        department,
        id: {
          [Op.like]: `${department}-${dateStr}-%`
        }
      },
      order: [['id', 'DESC']],
      transaction,
      lock: true // This ensures serialization of concurrent requests
    });

    // Extract counter from last request or start at 0
    let counter = 0;
    if (lastRequest) {
      const lastCounter = parseInt(lastRequest.id.split('-')[2]);
      counter = lastCounter;
    }

    // Generate new ID with incremented counter
    const customId = `${department}-${dateStr}-${(counter + 1).toString().padStart(3, '0')}`;

    const newRequest = await RtiRequest.create({
      id: customId,
      citizen_id: req.user.id,
      department,
      subject,
      description,
      status: 'Pending',
      created_at: new Date(),
      attachment: req.file ? req.file.buffer : null,
      file_name: req.file ? req.file.originalname : null, // Store original filename
    });

    // Log the request creation
    await RequestLogger.logStatusChange(
      newRequest.id,
      null,
      'Pending',
      req.user.id,
      'New RTI request created'
    );

    // If there's an attachment, log it
    if (req.file) {
      await RequestLogger.logAttachment(
        newRequest.id,
        req.file.originalname,
        req.user.id
      );
    }

    await transaction.commit();

    res.status(201).json({ 
      success: true, 
      request: {
        id: newRequest.id,
        subject: newRequest.subject,
        status: newRequest.status,
        date: new Date(newRequest.created_at).toLocaleDateString(),
        file_name: newRequest.file_name
      }
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Error creating RTI request:', err);
    res.status(500).json({ 
      error: 'Failed to create request',
      details: err.message 
    });
  }
});

// Add this new route to get departments
router.get("/departments", auth, async (req, res) => {
  try {
    const departments = await Department.findAll({
      attributes: ['code', 'name_en'],
      order: [['name_en', 'ASC']]
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single request details
router.get('/request/:id', auth, async (req, res, next) => {
  try {
    const citizenId = req.user.id;
    
    const request = await RtiRequest.findOne({
      where: { 
        id: req.params.id,
        citizen_id: citizenId
      },
      include: [
        {
          model: Department,
          as: 'departmentDetails',
          attributes: ['name_en']
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
      response_file_name: request.response_file_name,
      department: request.departmentDetails ? {
        code: request.department,
        name_en: request.departmentDetails.name_en,
      } : null
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Get request logs
router.get('/request/:id/logs', auth, async (req, res, next) => {
  try {
    const citizenId = req.user.id;
    
    // First verify the request belongs to this citizen
    const request = await RtiRequest.findOne({
      where: { 
        id: req.params.id,
        citizen_id: citizenId
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Get all logs for this request
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
    console.error('Error fetching request logs:', err);
    res.status(500).json({ error: err.message });
  }
});

// Download response file
router.get('/request/:id/response-file', auth, async (req, res, next) => {
  try {
    const citizenId = req.user.id;
    
    const request = await RtiRequest.findOne({
      where: { 
        id: req.params.id,
        citizen_id: citizenId,
        status: 'Approved'
      },
      attributes: ['response_file', 'response_file_name']
    });

    if (!request || !request.response_file) {
      return res.status(404).json({ error: 'Response file not found' });
    }

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${request.response_file_name}"`,
    });

    res.send(request.response_file);
  } catch (err) {
    console.error('Error downloading response file:', err);
    next(err);
  }
});

// Update request status
router.put('/request/:id/status', auth, async (req, res) => {
  try {
    const { status, rejection_reason } = req.body;
    const request = await RtiRequest.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const oldStatus = request.status;
    await request.update({ 
      status,
      rejection_reason: status === 'Rejected' ? rejection_reason : null
    });

    // Create log entry
    await RtiLog.create({
      request_id: request.id,
      action_type: 'STATUS_CHANGED',
      old_value: oldStatus,
      new_value: status,
      remarks: status === 'Rejected' ? rejection_reason : null,
      performed_by: req.user.id
    });

    // Create notification for the citizen
    let notificationMessage;
    switch (status) {
      case 'Processing':
        notificationMessage = `Your RTI request "${request.subject}" is now being processed.`;
        break;
      case 'Approved':
        notificationMessage = `Your RTI request "${request.subject}" has been approved.`;
        break;
      case 'Rejected':
        notificationMessage = `Your RTI request "${request.subject}" has been rejected. Reason: ${rejection_reason}`;
        break;
      default:
        notificationMessage = `Your RTI request "${request.subject}" status has been updated to ${status}.`;
    }

    await NotificationService.createNotification({
      userId: request.user_id,
      message: notificationMessage,
      requestId: request.id,
      notificationType: 'STATUS_CHANGED'
    });

    res.json({ message: 'Request status updated successfully' });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

module.exports = router;