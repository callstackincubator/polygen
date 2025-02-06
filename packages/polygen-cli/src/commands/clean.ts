import fs from 'node:fs/promises';
import { Project } from '@callstack/polygen-project';
import chalk from 'chalk';
import { Command } from 'commander';
import consola from 'consola';
import { oraPromise } from 'ora';

const command = new Command('clean')
  .description('Cleans all WASM generated output files')
  .option('-y, --yes', 'Remove files without confirmation');

interface Options {
  yes: boolean;
}

command.action(async (options: Options) => {
  const project = await Project.findClosest();
  const generatedPath = project.fullOutputDirectory;
  const displayPath = project.localOutputDirectory;

  let confirmed = options.yes;

  if (!confirmed) {
    confirmed = await consola.prompt(
      `Remove directory ${chalk.bold(displayPath)}?`,
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
    fs.rm(generatedPath, { recursive: true, force: true }),
    `Removing ${chalk.bold(displayPath)}`
  );

  consola.success('Generated files removed!');
});

export default command;
