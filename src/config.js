require('dotenv').config();

module.exports = {
  clientId: process.env.CLIENT_ID || '8zxynlxwp7ec520',
  tokenKey: process.env.TOKEN_KEY || 'refresh-token',
  baseURL: process.env.BASE_URL || 'http://localhost',
  port: process.env.PORT || 3000,
};
