#!/usr/bin/env node
import { Command } from 'commander';
import { oraPromise } from 'ora';
import fs from 'node:fs/promises';
import { Project } from '@callstack/polygen-core-build';
import chalk from 'chalk';
import consola from 'consola';

// TODO: move to project info
const GENERATED_DIR = 'wasm/_generated';

const command = new Command('clean')
  .description('Cleans all WASM generated output files')
  .option('-y, --yes', 'Remove files without confirmation');

command.action(async (options) => {
  const project = await Project.findClosest();
  const generatedPath = project.fullOutputDirectory;

  let confirmed = options.yes;

  if (!confirmed) {
    confirmed = await consola.prompt(
      `Remove directory ${chalk.bold(generatedPath)}?`,
      {
        type: 'confirm',
      }
    );
  }

  if (!confirmed) {
    console.info('Clean canceled');
    return;
  }

  await oraPromise(
    fs.rm(generatedPath, { recursive: true }),
    `Removing ${chalk.bold(GENERATED_DIR)}`
  );

  consola.success('Generated files removed!');
});

export default command;
