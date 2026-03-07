const { sequelize } = require('../config/database');
const { User } = require('../models');
const { hashPassword } = require('../utils/hashPassword');
const config = require('../config/config');

const seedAdmin = async () => {
  try {
    await sequelize.sync();

    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Skipping seed.');
      process.exit(0);
    }

    const hashedPassword = await hashPassword(config.admin.password);

    await User.create({
      username: config.admin.username,
      email: config.admin.email,
      password: hashedPassword,
      role: 'admin',
      bio: 'BlogNest Administrator',
      avatar: '',
    });

    console.log('✅ Admin user created successfully.');
    console.log(`   Email: ${config.admin.email}`);
    console.log(`   Password: ${config.admin.password}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();

