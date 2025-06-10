const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const userRoutes= require('./routes/user.routes');
const adminRoutes= require('./routes/admin.routes');
const departmentRoutes= require('./routes/department.routes');
const spioRoutes = require('./routes/spio.routes');
const assistantRoutes = require('./routes/assistant.routes');
const stateRoutes = require('./routes/state.routes');
const notificationRoutes = require('./routes/notification.routes');
const db = require('./config/database');

const app = express();


db.sequelize.authenticate()
  .then(() => {
    console.log('DB connected.');
  })
  .catch(err => {
    console.error('DB connection error:', err);
  });


// Security middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(cookieParser()); // Parse cookies

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 to 500
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://rti-information-dispersal-system.vercel.app', 'http://localhost:5173']
    : process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow credentials
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/department',departmentRoutes);
app.use('/api/spio', spioRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'RateLimitExceeded') {
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

