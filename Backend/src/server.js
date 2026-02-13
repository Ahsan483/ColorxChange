require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const prisma = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  try {
    // Check DB connection
    await prisma.$connect();
    logger.info(`✅ Database connected successfully`);
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
  } catch (error) {
    logger.error('❌ Database connection failed', error);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
