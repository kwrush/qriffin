const { DropboxAuth, Dropbox } = require('dropbox');
const fetch = require('node-fetch');
const { tokenKey, clientId } = require('./config');
const createAuthServer = require('./createAuthServer');

module.exports = async (spinner, config) => {
  if (clientId == null) {
    throw new Error(
      'A client id is required, you can specify the client id with `CLIENT_ID` environment variable',
    );
  }

  const dbxAuth = new DropboxAuth({ fetch, clientId });
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
