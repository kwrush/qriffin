const { DropboxAuth, Dropbox } = require('dropbox');
const fetch = require('node-fetch');
const createAuthServer = require('./createAuthServer');

const tokenKey = process.env.TOKEN_KEY;

module.exports = async (spinner, config) => {
  const dbxAuth = new DropboxAuth({ fetch, clientId: process.env.CLIENT_ID });
  const refreshToken = config.get(tokenKey);

  if (refreshToken == null) {
    spinner.text = 'Authorizing...\n';
    const newToken = await createAuthServer(dbxAuth);
    if (newToken == null) {
      throw new Error('Cannot get refresh token, authorization fails');
    }

    dbxAuth.setRefreshToken(newToken);
    config.set(tokenKey, newToken);
  } else {
    dbxAuth.setRefreshToken(refreshToken);
  }

  return new Dropbox({ auth: dbxAuth });
};
