const config = require('./config');

module.exports = {
  secret: config.jwt.secret,
  expiresIn: config.jwt.expiresIn,
};
