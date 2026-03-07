const { User } = require('../models');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const generateToken = require('../utils/generateToken');

const register = async ({ username, email, password }) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error('Email already registered.');
    error.statusCode = 409;
    throw error;
  }

  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    const error = new Error('Username already taken.');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({ username, email, password: hashedPassword });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

module.exports = { register, login };
