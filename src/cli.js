require('dotenv').config();

const program = require('commander');
const chalk = require('chalk');

(() => {
  const meta = require('../package.json');

  program.version(chalk.cyan(`fox-cli v${meta.version}`), '-v, --version').usage('[--options] <file>').parse(process.argv);

  const [file] = program.args;
  runCli(file, program.opts());
})();

function runCli(file, options) {
  console.log(file);
}

