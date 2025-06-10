const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const db = require('../config/database');
const { sequelize, RtiRequest, Department, User, District } = db;
const auth = require('../middleware/auth');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Get detailed information for a single request - accessible by all authenticated users
router.get('/request/:id', auth, async (req, res, next) => {  try {
    // Find request with basic details that all users can see
    const queryOptions = {
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
          attributes: ['name_en', 'name_as']
        }
      ]
    }

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
      department: {
        code: request.department,
        name_en: request.departmentDetails.name_en,
        name_as: request.departmentDetails.name_as
      },
      departmentDetails: request.departmentDetails,
      hasAttachment: !!request.file_name
    };

    // Add citizen details if admin or the requesting user is the citizen
    if (req.user.role !== '1' || request.citizen.id === req.user.id) {
      response.citizen = request.citizen;
    }

    // Add rejection reason if request is rejected or user is admin
    if (request.status === 'Rejected' || ['2', '3', '4', '5'].includes(req.user.role)) {
      response.rejection_reason = request.rejection_reason;
    }

    // Add admin-specific fields for admin roles
    if (['3', '4', '5'].includes(req.user.role)) {
      response.assigned_to = request.assigned_to;
      response.assignedAssistant = request.assignedAssistant;
      response.review_status = request.review_status;
      response.assignment_date = request.assignment_date;
      response.assistant_remarks = request.assistant_remarks;
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Download attachment
router.get('/request/:id/attachment', auth, async (req, res, next) => {
  try {
    const request = await RtiRequest.findOne({
      where: { id: req.params.id },
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

// returns total, Approved, Rejected, Pending counts
router.get('/stats', auth, async (req, res, next) => {
  try {
    let departmentQuery = '';
    
    if (req.user.role === '3') { // SPIO role
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
      departmentQuery = `WHERE department IN ('${departmentCodes.join("','")}')`;
    }

    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'Processing')::INTEGER   AS "processingRequests",
        COUNT(*) FILTER (WHERE status = 'Approved')::INTEGER   AS "ApprovedRequests",
        COUNT(*) FILTER (WHERE status = 'Rejected')::INTEGER   AS "RejectedRequests",
        COUNT(*) FILTER (WHERE status = 'Pending')::INTEGER    AS "PendingRequests"
      FROM rti_requests
      ${departmentQuery};
    `;
    
    const [results] = await db.sequelize.query(sql, {
      type: db.Sequelize.QueryTypes.SELECT,
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
});


// Get all requests (filtered by district for SPIO)
router.get('/all-requests', auth, async (req, res, next) => {
  try {
    // Get departments in user's district for SPIO
    let departmentQuery = {};
    
    if (req.user.role === '3') { // SPIO role
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
      departmentQuery = {
        department: {
          [Op.in]: departmentCodes
        }
      };
    }

    const requests = await RtiRequest.findAll({
      where: departmentQuery,
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
      department: request.departmentDetails.name_en,
      department_code: request.department,
      citizen: request.citizen,
      file_name: request.file_name,
      assigned_to: request.assigned_to,
      review_status: request.review_status,
      assignment_date: request.assignment_date,
      assistant_remarks: request.assistant_remarks
    }));

    res.json(formattedRequests);
  } catch (err) {
    console.error('Error fetching all requests:', err);
    next(err);
  }
});

// Forward a request
router.put('/request/:id/forward', auth, async (req, res, next) => {
  try {
    const request = await RtiRequest.findOne({ 
      where: { id: req.params.id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update the status to Processing
    await request.update({ status: 'Processing' });

    res.json({ message: 'Request forwarded successfully' });
  } catch (err) {
    next(err);
  }
});

// Department Routes
router.get('/departments', auth, async (req, res, next) => {
  try {
    const departments = await Department.findAll({
      order: [['code', 'ASC']]
    });
    res.json(departments);
  } catch (err) {
    next(err);
  }
});

// ... existing routes ...

router.post('/departments', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { district_id, name_en, pio_name, pio_email, pio_phone, pio_password, pio_address } = req.body;    // Only SPIO (role "3") can create departments
    if (req.user.role !== "3") {
      await t.rollback();
      return res.status(403).json({ error: 'Only SPIO can create departments' });
    }

    // First get the user's district details
    const userDistrict = await District.findOne({
      where: { district_code: req.user.district_code },
      transaction: t
    });

    if (!userDistrict) {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid SPIO district' });
    }

    // Verify SPIO is creating department for their own district
    if (parseInt(district_id) !== userDistrict.district_id) {
      await t.rollback();
      return res.status(403).json({ error: 'You can only create departments for your assigned district' });
    }

    // Get full district details
    const district = await District.findOne({
      where: { district_id: district_id },
      transaction: t
    });

    if (!district) {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid district selected' });
    }

    // Get the last department code for this district
    const lastDepartment = await Department.findOne({
      where: {
        code: {
          [Op.like]: `${district.district_code}%`
        }
      },
      order: [['code', 'DESC']],
      transaction: t,
      lock: true
    });

    // Generate new department code
    let newSerial = '001';
    if (lastDepartment) {
      const lastSerial = parseInt(lastDepartment.code.slice(-3));
      newSerial = (lastSerial + 1).toString().padStart(3, '0');
    }
    const code = `${district.district_code}${newSerial}`;
    
    // Check if department already exists
    const existingDept = await Department.findOne({ 
      where: { code },
      transaction: t
    });
    
    if (existingDept) {
      await t.rollback();
      return res.status(400).json({ error: 'Department with this code already exists' });
    }

    // Check if email or phone already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: pio_email },
          { phone: pio_phone }
        ]
      },
      transaction: t
    });

    if (existingUser) {
      await t.rollback();
      return res.status(400).json({ 
        error: existingUser.email === pio_email ? 
          'Email already registered' : 
          'Phone number already registered' 
      });
    }

    // Create department
    const department = await Department.create({
      code,
      name_en,
      district_id
    }, { transaction: t });

    // Create PIO user - password will be hashed by the User model hooks
    await User.create({
      name: pio_name,
      email: pio_email,
      phone: pio_phone,
      password: pio_password,
      role: '2', // PIO role
      department_code: code,
      address: pio_address
    }, { transaction: t });

    await t.commit();
    res.status(201).json(department);
  } catch (err) {
    await t.rollback();
    console.error('Error creating department and PIO:', err);
    res.status(500).json({ 
      error: 'Failed to create department and PIO',
      details: err.message
    });
  }
});

router.put('/departments/:code', auth, async (req, res, next) => {
  try {
    const { name_en } = req.body;
    const { code } = req.params;

    const department = await Department.findByPk(code);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    await department.update({ name_en });
    res.json(department);
  } catch (err) {
    next(err);
  }
});

router.delete('/departments/:code', auth, async (req, res, next) => {
  try {
    const { code } = req.params;

    // Check if department has any RTI requests
    const hasRequests = await RtiRequest.findOne({
      where: { department: code }
    });

    if (hasRequests) {
      return res.status(400).json({ 
        error: 'Cannot delete department with existing RTI requests' 
      });
    }

    const department = await Department.findByPk(code);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    await department.destroy();
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Get all requests for a district (for SPIO)
router.get('/district-requests', auth, async (req, res, next) => {
  try {
    // Only SPIO (role "3") can access this
    if (req.user.role !== "3") {
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
          attributes: ['name_en', 'name_as']
        }
      ],
      where: {
        district_code: req.user.district_code // Filter by SPIO's district
      },
      order: [['created_at', 'DESC']]
    });

    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// Get all SPIO Assistants for a district
router.get('/spio-assistants', auth, async (req, res, next) => {
  try {
    // Only SPIO Admin (role "3") can view their assistants
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const assistants = await User.findAll({
      where: {
        role: '4',
        district_code: req.user.district_code
      },
      attributes: { exclude: ['password'] }
    });

    res.json(assistants);
  } catch (err) {
    next(err);
  }
});

// Get stats for a district
router.get('/district-stats', auth, async (req, res, next) => {
  try {
    // Only SPIO (role "3") can access this
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'Processing' AND district_code = :districtCode)::INTEGER AS "processingRequests",
        COUNT(*) FILTER (WHERE status = 'Approved' AND district_code = :districtCode)::INTEGER AS "ApprovedRequests",
        COUNT(*) FILTER (WHERE status = 'Rejected' AND district_code = :districtCode)::INTEGER AS "RejectedRequests",
        COUNT(*) FILTER (WHERE status = 'Pending' AND district_code = :districtCode)::INTEGER AS "PendingRequests"
      FROM rti_requests;
    `;
    
    const [results] = await db.sequelize.query(sql, {
      replacements: { districtCode: req.user.district_code },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// State Admin routes
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
          attributes: ['name_en', 'name_as']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(requests);
  } catch (err) {
    next(err);
  }
});
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
          attributes: ['name_en', 'name_as']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// Get all SPIOs (for State Admin)
router.get('/all-spios', auth, async (req, res, next) => {
  try {
    // Only State Admin (role "5") can access this
    if (req.user.role !== "5") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const spios = await User.findAll({
      where: {
        role: '3' // SPIO Admin role
      },
      attributes: { exclude: ['password'] }
    });

    res.json(spios);
  } catch (err) {
    next(err);
  }
});

// Add new SPIO (by State Admin)
router.post('/spio', auth, async (req, res, next) => {
  const t = await db.sequelize.transaction();
  
  try {
    // Only State Admin (role "5") can add SPIOs
    if (req.user.role !== "5") {
      return res.status(403).json({ error: 'Only State Admin can add SPIOs' });
    }

    const { 
      name,
      email,
      phone,
      password,
      address,
      district_code
    } = req.body;
    
    // Validate district
    const district = await District.findOne({ where: { district_code } });
    if (!district) {
      return res.status(400).json({ error: 'Invalid district code' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create SPIO user - password will be hashed by the model's beforeCreate hook
    const spio = await User.create({
      name,
      email,
      phone,
      password, // Pass the plain password - model hook will hash it
      address,
      district_code,
      role: '3' // SPIO role
    }, { transaction: t });

    await t.commit();
    res.status(201).json({
      message: 'SPIO added successfully',
      user: {
        id: spio.id,
        name: spio.name,
        email: spio.email,
        phone: spio.phone,
        address: spio.address,
        district_code: spio.district_code
      }
    });
  } catch (err) {
    await t.rollback();
    console.error('Error creating SPIO:', err);
    res.status(500).json({ 
      error: 'Failed to create SPIO',
      details: err.message
    });
  }
});

// Get all districts
router.get('/districts', auth, async (req, res, next) => {
  try {
    console.log('Fetching districts...'); // Debug log
    const districts = await District.findAll({
      order: [['district_name', 'ASC']],
      attributes: ['state_id', 'district_id', 'state_name', 'district_name', 'district_code']
    });
    console.log('Found districts:', districts.length); // Debug log
    res.json(districts);
  } catch (err) {
    console.error('Error in /districts endpoint:', err);
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
});

// Get all SPIOs
router.get('/spios', auth, async (req, res, next) => {
  try {
    const spios = await User.findAll({
      where: { role: '4' },
      attributes: ['id', 'name', 'email', 'phone', 'address', 'district_code', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    res.json(spios);
  } catch (error) {
    console.error('Error fetching SPIOs:', error);
    res.status(500).json({ error: 'Failed to fetch SPIOs' });
  }
});

// Get all users
router.get('/users', auth, async (req, res, next) => {
  try {
    // Only State Admin (role "5") can access this
    if (req.user.role !== "5") {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });

    res.json(users);
  } catch (err) {
    next(err);
  }
});

// Add new SPIO Assistant
router.post('/spio-assistant', auth, async (req, res, next) => {
  const t = await db.sequelize.transaction();
  
  try {
    // Only SPIO Admin (role "3") can add assistants
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Only SPIO Admin can add assistants' });
    }

    const { 
      name,
      email,
      phone,
      password,
      address
    } = req.body;
    
    // Check if email or phone already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { phone }
        ]
      },
      transaction: t
    });

    if (existingUser) {
      await t.rollback();
      return res.status(400).json({ 
        error: existingUser.email === email ? 
          'Email already registered' : 
          'Phone number already registered' 
      });
    }

    // Create SPIO Assistant user
    const assistant = await User.create({
      name,
      email,
      phone,
      password,
      role: '4', // SPIO Assistant role
      district_code: req.user.district_code, // Use SPIO's district
      address
    }, { transaction: t });

    await t.commit();
    res.status(201).json({
      message: 'Assistant added successfully',
      user: {
        id: assistant.id,
        name: assistant.name,
        email: assistant.email,
        phone: assistant.phone,
        address: assistant.address,
        district_code: assistant.district_code
      }
    });
  } catch (err) {
    await t.rollback();
    console.error('Error creating SPIO Assistant:', err);
    res.status(500).json({ 
      error: 'Failed to create SPIO Assistant',
      details: err.message
    });
  }
});

// Update SPIO Assistant
router.put('/spio-assistant/:id', auth, async (req, res, next) => {
  const t = await db.sequelize.transaction();
  
  try {
    // Only SPIO Admin (role "3") can update assistants
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Only SPIO Admin can update assistants' });
    }

    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    // Find assistant and verify they belong to the SPIO's district
    const assistant = await User.findOne({
      where: {
        id,
        role: '4',
        district_code: req.user.district_code
      }
    });

    if (!assistant) {
      return res.status(404).json({ error: 'Assistant not found' });
    }

    // Check if new email/phone conflicts with existing users
    if (email !== assistant.email || phone !== assistant.phone) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email },
            { phone }
          ],
          id: { [Op.ne]: id }
        }
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: existingUser.email === email ? 
            'Email already registered' : 
            'Phone number already registered' 
        });
      }
    }

    // Update assistant
    await assistant.update({
      name,
      email,
      phone,
      address
    }, { transaction: t });

    await t.commit();
    res.json({
      message: 'Assistant updated successfully',
      user: {
        id: assistant.id,
        name: assistant.name,
        email: assistant.email,
        phone: assistant.phone,
        address: assistant.address,
        district_code: assistant.district_code
      }
    });
  } catch (err) {
    await t.rollback();
    console.error('Error updating SPIO Assistant:', err);
    res.status(500).json({ 
      error: 'Failed to update SPIO Assistant',
      details: err.message
    });
  }
});

// Delete SPIO Assistant
router.delete('/spio-assistant/:id', auth, async (req, res, next) => {
  const t = await db.sequelize.transaction();
  
  try {
    // Only SPIO Admin (role "3") can delete assistants
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Only SPIO Admin can delete assistants' });
    }

    const { id } = req.params;

    // Find assistant and verify they belong to the SPIO's district
    const assistant = await User.findOne({
      where: {
        id,
        role: '4',
        district_code: req.user.district_code
      }
    });

    if (!assistant) {
      return res.status(404).json({ error: 'Assistant not found' });
    }

    // Delete assistant
    await assistant.destroy({ transaction: t });

    await t.commit();
    res.json({ message: 'Assistant deleted successfully' });
  } catch (err) {
    await t.rollback();
    console.error('Error deleting SPIO Assistant:', err);
    res.status(500).json({ 
      error: 'Failed to delete SPIO Assistant',
      details: err.message
    });
  }
});

// Get district details by district code
router.get('/district/:district_code', auth, async (req, res) => {
  try {
    const district = await District.findOne({
      where: { district_code: req.params.district_code },
      attributes: ['district_id', 'district_code', 'district_name', 'state_id', 'state_name']
    });

    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }

    res.json(district);
  } catch (err) {
    console.error('Error fetching district:', err);
    res.status(500).json({ error: 'Failed to fetch district details' });
  }
});

// Get departments by district ID
router.get('/departments/district/:district_id', auth, async (req, res) => {
  try {
    // Verify user has access to this district (SPIO role check)
    if (req.user.role !== '3') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const departments = await Department.findAll({
      where: { 
        district_id: req.params.district_id 
      },
      attributes: ['code', 'name_en'],
      order: [['name_en', 'ASC']]
    });

    res.json(departments);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Assign RTI request to assistant
router.post('/requests/:id/assign', auth, async (req, res, next) => {
  try {
    // Only SPIO Admin (role "3") can assign requests
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Only SPIO Admin can assign requests' });
    }

    const { assistantId } = req.body;
    const requestId = req.params.id;

    // Verify the request exists and belongs to SPIO's district
    const request = await RtiRequest.findOne({
      where: { 
        id: requestId,
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'RTI request not found' });
    }

    // Verify the assistant exists and belongs to SPIO's district
    const assistant = await User.findOne({
      where: {
        id: assistantId,
        role: '4', // SPIO Assistant role
        district_code: req.user.district_code
      }
    });

    if (!assistant) {
      return res.status(404).json({ error: 'Assistant not found' });
    }

    // Update request with assignment info
    await request.update({
      assigned_to: assistantId,
      assignment_date: new Date(),
      review_status: 'pending'
    });

    res.json({ message: 'Request assigned successfully' });
  } catch (err) {
    console.error('Error assigning request:', err);
    res.status(500).json({
      error: 'Failed to assign request',
      details: err.message
    });
  }
});

// Submit review for assigned request
router.put('/requests/:id/review', auth, async (req, res, next) => {
  try {
    // Only SPIO Assistants (role "4") can submit reviews
    if (req.user.role !== "4") {
      return res.status(403).json({ error: 'Only SPIO Assistants can submit reviews' });
    }

    const { remarks } = req.body;
    const requestId = req.params.id;

    // Verify the request is assigned to this assistant
    const request = await RtiRequest.findOne({
      where: { 
        id: requestId,
        assigned_to: req.user.id,
        review_status: 'pending'
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Assigned request not found' });
    }

    // Update request with assistant remarks
    await request.update({
      assistant_remarks: remarks,
      review_status: 'reviewed'
    });

    res.json({ message: 'Review submitted successfully' });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({
      error: 'Failed to submit review',
      details: err.message
    });
  }
});

// Get assigned requests for assistant
router.get('/assigned-requests', auth, async (req, res, next) => {
  try {
    // Only SPIO Assistants (role "4") can view their assignments
    if (req.user.role !== "4") {
      return res.status(403).json({ error: 'Only SPIO Assistants can view assigned requests' });
    }

    const requests = await RtiRequest.findAll({
      where: { 
        assigned_to: req.user.id
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
          attributes: ['name_en', 'name_as']
        }
      ],
      order: [['assignment_date', 'DESC']]
    });

    const formattedRequests = requests.map(request => ({
      id: request.id,
      subject: request.subject,
      description: request.description,
      status: request.status,
      date: new Date(request.created_at).toLocaleDateString(),
      assignmentDate: new Date(request.assignment_date).toLocaleDateString(),
      file_name: request.file_name,
      department: {
        code: request.department,
        name_en: request.departmentDetails.name_en,
        name_as: request.departmentDetails.name_as
      },
      citizen: request.citizen,
      hasAttachment: !!request.file_name,
      review_status: request.review_status,
      assistant_remarks: request.assistant_remarks
    }));

    res.json(formattedRequests);
  } catch (err) {
    console.error('Error fetching assigned requests:', err);
    res.status(500).json({
      error: 'Failed to fetch assigned requests',
      details: err.message
    });
  }
});

// Get reviewed requests for SPIO
router.get('/reviewed-requests', auth, async (req, res, next) => {
  try {
    // Only SPIO Admin (role "3") can view reviewed requests
    if (req.user.role !== "3") {
      return res.status(403).json({ error: 'Only SPIO Admin can view reviewed requests' });
    }

    const requests = await RtiRequest.findAll({
      where: {
        district_code: req.user.district_code,
        review_status: 'reviewed'
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
          attributes: ['name_en', 'name_as']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['name', 'email']
        }
      ],
      order: [['assignment_date', 'DESC']]
    });

    const formattedRequests = requests.map(request => ({
      id: request.id,
      subject: request.subject,
      description: request.description,
      status: request.status,
      date: new Date(request.created_at).toLocaleDateString(),
      assignmentDate: new Date(request.assignment_date).toLocaleDateString(),
      file_name: request.file_name,
      department: {
        code: request.department,
        name_en: request.departmentDetails.name_en,
        name_as: request.departmentDetails.name_as
      },
      citizen: request.citizen,
      assistant: request.assignee,
      hasAttachment: !!request.file_name,
      assistant_remarks: request.assistant_remarks
    }));

    res.json(formattedRequests);
  } catch (err) {
    console.error('Error fetching reviewed requests:', err);
    res.status(500).json({
      error: 'Failed to fetch reviewed requests',
      details: err.message
    });
  }
});

module.exports = router;


// // Import route modules
// const requestRoutes = require('./admin.request.routes');
// const departmentRoutes = require('./admin.department.routes');
// const spioRoutes = require('./admin.spio.routes');
// const districtRoutes = require('./admin.district.routes');
// const assistantRoutes = require('./admin.assistant.routes');

// // Mount the routes
// router.use('/requests', requestRoutes);
// router.use('/departments', departmentRoutes);
// router.use('/spio', spioRoutes);
// router.use('/districts', districtRoutes);
// router.use('/assistants', assistantRoutes);