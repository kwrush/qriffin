const http = require('http');
const opn = require('better-opn');
const chalk = require('chalk');

const { port, baseURL } = require('./config');
const mainURL = `${baseURL}:${port}`;
const redirectURL = new URL('/auth', mainURL);

module.exports = (dbxAuth) => {
  const authURL = dbxAuth.getAuthenticationUrl(
    redirectURL,
    null,
    'code',
    'offline',
    null,
    'none',
    true,
  );

  return new Promise((resolve, reject) => {
    http
      .createServer((req, res) => {
        const url = new URL(req.url, mainURL);
        const code = url.searchParams.get('code');

        if (!code) {
          fail(res);
          return reject(new Error('Cannot get the access code'));
        }

        dbxAuth
          .getAccessTokenFromCode(redirectURL.href, code)
          .then(({ status, result }) => {
            if (status >= 400) {
              throw new Error('Authorization fails');
            }
            success(res);
            resolve(result.refresh_token);
          })
          .catch((error) => {
            fail(res);
            reject(error);
          });
      })
      .listen(port, openBrowser(authURL));
  });
};

function openBrowser(url) {
  return () => {
    console.log(
      `If your browser doesn't open automatically, please open this link manually: ${chalk.green.underline(
        url,
      )}\n`,
    );

    opn(url);
  };
}

function success(res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(
    '<html><body><h3>Authorized successfully</h3><p>You can close this tab and enjoy qriffin</p></body></html>',
  );
}

function fail(res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(
    '<html><body><h3>Authorization fails</h3><p>Please close this tab and try again</p></body></html>',
  );
}
