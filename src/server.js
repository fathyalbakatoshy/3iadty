const app = require('./app');
const connectDB = require('./config/database');

// Get port from environment variable or use default
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB()
  .then(() => {
    console.log('✅ Database connected successfully');
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
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
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }); 