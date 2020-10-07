require('dotenv').config();

const program = require('commander');
const chalk = require('chalk');
const Configstore = require('configstore');
const ora = require('ora');

const setupDbx = require('./setupDbx');

(async () => {
  const meta = require('../package.json');
  const config = new Configstore(meta.name);

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
    console.log(dbx.auth.getRefreshToken());
  } catch (error) {
    spinner.fail();
    console.error(chalk.red(error.message));
  }

  process.exit(0);
}
