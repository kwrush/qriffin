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
  program
    .version(chalk.cyan(`fox-cli v${meta.version}`), '-v, --version')
    .usage('[--options] <file>')
    .option(
      '-d, --directory <dir>',
      'specify the directory in Dropbox to save the uploaded file',
    )
    .option(
      '-c, --clear',
      'clear the locally stored refresh token and quit the program',
    )
    .parse(process.argv);

  const [file] = program.args;
  await runCli(file, program.opts(), config);
})();

async function runCli(file, options, config) {
  const { clear, directory } = options;

  if (clear) {
    config.delete(process.env.TOKEN_KEY);
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
}
