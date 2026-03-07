const app = require('./app');
const config = require('./config/config');
const { connectDB } = require('./config/database');
const { sequelize } = require('./models');

const startServer = async () => {
  try {
    await connectDB();

    // Sync database tables
    await sequelize.sync({ alter: config.nodeEnv === 'development' });
    console.log('✅ Database tables synced.');

    app.listen(config.port, () => {
      console.log(`🚀 BlogNest server running on http://localhost:${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

