require('dotenv').config();

module.exports = {
  clientId: process.env.CLIENT_ID || 'ssa1frswqq0sc2v',
  tokenKey: process.env.TOKEN_KEY || 'refresh-token',
  baseURL: process.env.BASE_URL || 'http://localhost',
  port: process.env.PORT || 3000,
};
