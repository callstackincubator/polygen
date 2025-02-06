#!/usr/bin/env node
import {
  CONFIG_FILE_NAMES,
  InvalidProjectConfigurationError,
  ProjectConfigurationNotFound,
  UnknownProjectError,
} from '@callstack/polygen-config/find';
import chalk from 'chalk';
import { Command } from 'commander';
import consola from 'consola';
import cleanCommand from './commands/clean.js';
import generateCommand from './commands/generate.js';
import initCommand from './commands/init.js';
import scanCommand from './commands/scan.js';

const program = new Command();

program.name('polygen').description('Generates React Native Modules from Wasm');

program
  .configureHelp({ showGlobalOptions: true })
  .option('-p, --project', 'Path to JS project')
  .option('-c, --config', 'Path to configuration file')
  .option('-v, --verbose', 'Output verbose');

program.addCommand(initCommand);
program.addCommand(scanCommand);
program.addCommand(generateCommand);
program.addCommand(cleanCommand);

program.action(() => {
  program.help();
});

async function run() {
  try {
    await program.parseAsync();
  } catch (e) {
    if (e instanceof InvalidProjectConfigurationError) {
      consola.error('Error loading configuration file: ', e.innerError);
    } else if (e instanceof UnknownProjectError) {
      consola.error('Could not find project');
    } else if (e instanceof ProjectConfigurationNotFound) {
      consola.error(
        `Could not find project configuration file. Accepted file names are: ` +
          CONFIG_FILE_NAMES.map((e) => chalk.bold(e)).join(', ')
      );
    } else {
      throw e;
    }
  }
}

run();
