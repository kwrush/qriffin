const chalk = require('chalk');
const ora = require('ora');

const { tokenKey } = require('./config');
const setupDbx = require('./setupDbx');
const { createSharedLink, upload } = require('./utils/dbxUtils');
const createQRCode = require('./utils/createQRCode');

module.exports = async (file, options, config) => {
  const { clearToken, directory } = options;

  if (clearToken) {
    config.delete(tokenKey);
    console.log(
      chalk.cyan(
        'Refresh token has been deleted, authorization is required next time.',
      ),
    );
    return process.exit(0);
  }

  const spinner = ora('Starting...\n').start();
  try {
    const dbx = await setupDbx(spinner, config);

    spinner.text = 'Uploading...\n';
    const uploadPath = await upload(dbx, file, directory);

    spinner.text = 'Creating shared link...\n';
    const sharedLink = await createSharedLink(dbx, uploadPath);
    const qrCode = await createQRCode(sharedLink);

    spinner.succeed(
      `The shared link is created successfully, scan the QR code or use the link: ${chalk.green.underline(
        sharedLink,
      )}`,
    );
    console.log(chalk.white(qrCode));
  } catch (error) {
    spinner.fail();
    console.error(chalk.red(error.message));
  }

  process.exit(0);
};
