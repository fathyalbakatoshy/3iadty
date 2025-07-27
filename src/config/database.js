const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // MongoDB 6.0+ no longer needs these options
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`🟢 MongoDB متصل بنجاح: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose متصل بـ MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ خطأ في الاتصال مع MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔴 Mongoose منقطع عن MongoDB');
    });

  } catch (error) {
    console.error('❌ خطأ في الاتصال مع قاعدة البيانات:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔴 تم قطع الاتصال مع MongoDB بسبب إنهاء التطبيق');
  process.exit(0);
});

module.exports = connectDB; 