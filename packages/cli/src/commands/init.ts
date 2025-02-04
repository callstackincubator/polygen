#!/usr/bin/env node
import fs from 'node:fs/promises';
import { Project } from '@callstack/polygen-core-build';
import chalk from 'chalk';
import { Command, Option } from 'commander';
import consola from 'consola';
import { detectPackageManager, ensureDependencyInstalled } from 'nypm';
import pkg from '../../package.json' with { type: 'json' };
import { isErrnoError } from '../helpers/errors.js';

const command = new Command('init')
  .description('Initializes React Native WebAssembly in current directory')
  .addOption(new Option('-f, --force', 'Override existing polygen.json'));

const DEFAULT_CONFIG = {
  version: 1,
  modules: [],
};

interface Options {
  force?: boolean;
}

command.action(async (options: Options) => {
  if (options.force) {
    consola.warn('Using force overwrite flag, all files will be overwritten');
  }

  consola.info(`Using ${chalk.bold.magenta(`Polygen ${pkg.version}`)}`);
  const project = await Project.findClosest();
  consola.info(`Found project at ${chalk.dim(project.projectRoot)}`);

  try {
    consola.info(`Creating ${chalk.dim('polygen.json')}...`);
    await fs.writeFile(
      project.pathTo('polygen.json'),
      JSON.stringify(DEFAULT_CONFIG, undefined, 2),
      // fail if it exists
      { flag: options.force ? 'w' : 'wx' }
    );
  } catch (err) {
    if (isErrnoError(err) && err.code === 'EEXIST') {
      consola.error('polygen.json already exists, aborting');
      return;
    }
    consola.error(err);
  }

  const pm = await detectPackageManager(process.cwd());
  if (!pm) {
    consola.error('Could not detect package manager');
    return;
  }

  const shouldInstall = await consola.prompt(
    `Do you want to install polygen in this project (using ${pm.name})?`,
    {
      type: 'confirm',
      cancel: 'null',
    }
  );

  if (shouldInstall === null) {
    consola.info('Aborted');
    return;
  }

  if (!shouldInstall) {
    const addCommand = pm.name === 'yarn' ? 'add' : 'install';
    const command = `${pm.name} ${addCommand} @callstack/polygen`;
    consola.info(
      `You can install polygen later by running: ${chalk.bold(command)}`
    );
  } else {
    await ensureDependencyInstalled('@callstack/polygen');
    consola.log(``);
  }

  const steps = [
    ' - Add your WebAssembly modules to your project',
    ` - Run ${chalk.bold('polygen update')} to update modules index`,
    ` - Run ${chalk.bold('polygen build')} to generate bindings`,
  ].join('\n');
  consola.box(`Next steps:\n${steps}`);

  // TODO: Add link to documentation
  // consola.log(``);
  // consola.log(`Polygen Documentation: ${chalk.underline('https://polygen.callstack.com')}`);
});

export default command;
