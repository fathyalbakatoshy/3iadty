const app = require('./app');
const connectDB = require('./config/database');
const { setupErrorHandlers } = require('./middlewares/errorHandler');
const { initializeRealTimeAudit } = require('./services/realTimeAudit');

require('dotenv').config();

// Get port from environment variable or use default
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB()
  .then(() => {
    console.log('✅ قاعدة البيانات متصلة بنجاح');
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`
🟢 ✅ خادم عياداتنا يعمل على البورت ${PORT}
🌐 البيئة: ${process.env.NODE_ENV || 'development'}
🔗 الرابط: http://localhost:${PORT}
📚 API: http://localhost:${PORT}/api
🏥 مرحباً بك في منصة عياداتنا - كوم حمادة، البحيرة
🔄 Real-time Audit: ${process.env.AUDIT_LOG_ENABLED !== 'false' ? 'مفعل' : 'معطل'}
      `);
    });

    // Initialize Real-time Audit System
    if (process.env.AUDIT_LOG_ENABLED !== 'false') {
      initializeRealTimeAudit(server);
      console.log('🔴 نظام التتبع المباشر مفعل - Real-time Audit Active');
    }

    // Setup error handlers for graceful shutdown
    setupErrorHandlers(server);

    // Graceful shutdown handlers
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

  })
  .catch((error) => {
    console.error('❌ فشل في الاتصال بقاعدة البيانات:', error);
    process.exit(1);
  }); 