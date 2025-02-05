import fs from 'node:fs/promises';
import path from 'node:path';
import {
  findConfigFile,
  findProjectRoot,
} from '@callstack/polygen-config/project';
import chalk from 'chalk';
import { Command } from 'commander';
import consola from 'consola';
import { addDependency, detectPackageManager, installDependencies } from 'nypm';
import { oraPromise } from 'ora';
import pkg from '../../package.json' with { type: 'json' };
import defaultConfig from '../templates/default-polygen-config.js';

const command = new Command('init').description(
  'Initializes React Native WebAssembly in current directory'
);

interface Options {}

command.action(async (options: Options) => {
  consola.info(`Using ${chalk.bold.magenta(`Polygen ${pkg.version}`)}`);
  const projectRoot = await findProjectRoot();
  consola.info(`Found project at ${chalk.dim(projectRoot)}`);

  const configFile = await findConfigFile(projectRoot);
  if (configFile) {
    consola.info('Configuration file already exists');
  } else {
    try {
      consola.info(`Creating ${chalk.dim('polygen.config.js')}...`);
      await fs.writeFile(
        path.join(projectRoot, 'polygen.config.js'),
        defaultConfig
      );
    } catch (err) {
      consola.error(err);
      return;
    }
  }

  const pm = await detectPackageManager(process.cwd());
  if (!pm) {
    consola.error('Could not detect package manager');
    return;
  }

  // TODO: add to git directory

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
    await oraPromise(async () => {
      await addDependency(['@callstack/polygen', '@callstack/polygen-config'], {
        silent: true,
      });
      await installDependencies({ silent: true });
    }, 'Installing Polygen');
  }

  const steps = [
    ' - Add your WebAssembly modules to your project',
    ` - Run ${chalk.bold('polygen scan')} to update modules index`,
    ` - Run ${chalk.bold('polygen build')} to generate bindings`,
  ].join('\n');
  consola.box(`Next steps:\n${steps}`);

  // TODO: Add link to documentation
  // consola.log(``);
  // consola.log(`Polygen Documentation: ${chalk.underline('https://polygen.callstack.com')}`);
});

export default command;
