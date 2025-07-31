const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import middlewares
const { errorHandler, notFound, setupErrorHandlers } = require('./middlewares/errorHandler');
const { auditLogger } = require('./middlewares/auditLogger');
const { initializeRealTimeAudit } = require('./services/realTimeAudit');

// Import routes
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const clinicRoutes = require('./routes/clinicRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const patientRoutes = require('./routes/patientRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const realTimeRoutes = require('./routes/realTimeRoutes');
const specializationRoutes = require('./routes/specializationRoutes');

// Create Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى للطلبات. حاول مرة أخرى لاحقاً',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all requests
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Audit logging middleware (before routes)
app.use(auditLogger());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'الخادم يعمل بشكل طبيعي',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/realtime', realTimeRoutes);
app.use('/api/specializations', specializationRoutes);
app.use('/api/public', publicRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'مرحباً بك في API منصة عياداتي الطبية',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      doctors: '/api/doctors',
      clinics: '/api/clinics',
      appointments: '/api/appointments',
      patients: '/api/patients',
      medicalRecords: '/api/medical-records',
      reviews: '/api/reviews',
      admin: '/api/admin',
      auditLogs: '/api/audit-logs',
      realtime: '/api/realtime',
      specializations: '/api/specializations',
      public: '/api/public'
    },
    documentation: 'قريباً...',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Export the app for use in server.js
// Database connection and server startup will be handled in server.js

module.exports = app; 