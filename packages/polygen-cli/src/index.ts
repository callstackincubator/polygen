#!/usr/bin/env node
import { Command } from 'commander';
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

program.parse();
