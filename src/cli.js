require('dotenv').config();

const program = require('commander');
const chalk = require('chalk');
const Configstore = require('configstore');
const ora = require('ora');

const setupDbx = require('./setupDbx');
const { createSharedLink, upload } = require('./utils/dbxUtils');
const createQRCode = require('./utils/createQRCode');

(async () => {
  const meta = require('../package.json');
  const config = new Configstore(meta.name);
  // TODO: Provide option '--clear' to clear local refresh token
  // TODO: Provide option '--target-path' to specify path in dropbox to save the uploading file
  program
    .version(chalk.cyan(`fox-cli v${meta.version}`), '-v, --version')
    .usage('[--options] <file>')
    .parse(process.argv);

  const [file] = program.args;
  await runCli(file, config);
})();

async function runCli(file, config) {
  const spinner = ora('Starting...\n').start();
  try {
    const dbx = await setupDbx(spinner, config);

    spinner.text = 'Uploading...\n';
    const uploadPath = await upload(dbx, file);

    spinner.text = 'Creating shared link...\n';
    const sharedLink = await createSharedLink(dbx, uploadPath);
    const qrCode = await createQRCode(sharedLink);

    spinner.succeed(
      `The shared link is created successfully, scan the QR code or use the link: ${chalk.green(
        sharedLink,
      )}`,
    );
    console.log(chalk.white(qrCode));
  } catch (error) {
    spinner.fail();
    console.error(chalk.red(error.message));
  }

  process.exit(0);
}
