const program = require('commander');
const Configstore = require('configstore');
const chalk = require('chalk');

const runCli = require('./cli');

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
      '-c, --clear-token',
      'clear the locally stored refresh token and quit the program',
    )
    .parse(process.argv);

  const [file] = program.args;
  await runCli(file, program.opts(), config);
})();
