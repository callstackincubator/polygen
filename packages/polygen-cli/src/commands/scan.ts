import { Project } from '@callstack/polygen-config/project';
import chalk from 'chalk';
import { Command, Option } from 'commander';
import consola from 'consola';
import { globby } from 'globby';
import { oraPromise } from 'ora';
import 'core-js/proposals/set-methods-v2.js';

const command = new Command('scan')
  .description('Searches for WebAssembly modules in the project')
  .addOption(
    new Option('-u, --update', 'Automatically update polygen.config.js file')
  );

interface Options {
  update: boolean;
}

command.action(async (options: Options) => {
  const project = await Project.findClosest();
  const { paths: pathsToScan } = project.options.scan;

  const files = await oraPromise(
    () => globby(pathsToScan),
    'Scanning for WebAssembly modules'
  );

  const currentModules = new Set(project.options.modules.map((m) => m.path));
  const foundModules = new Set(files);
  const added = foundModules.difference(currentModules);
  const removed = currentModules.difference(foundModules);

  consola.info(
    `Found ${chalk.bold(files.length)} WebAssembly module(s)`,
    chalk.green(`${chalk.bold(added.size)} new`) + `,`,
    chalk.red.bold(`${chalk.bold(removed.size)} removed`)
  );
  if (files.length === 0) {
    return;
  }

  consola.info(
    `To add them to the project, add following lines to ${chalk.bold('polygen.config.js')}:`
  );
  consola.log(``);

  const indent = '    ';
  const diff = Array.from(added.values())
    .map((file) => `localModule('${file}')`)
    .join(',\n' + indent);

  consola.log(chalk.gray('export default polygenConfig({'));
  consola.log(chalk.gray('  modules: ['));
  consola.log(chalk.gray('    // ...'));
  consola.log(chalk.green.bold('    ' + diff));
  consola.log(chalk.gray('    // ...'));
  consola.log(chalk.gray('  ]'));
  consola.log(chalk.gray('});'));
});

export default command;
