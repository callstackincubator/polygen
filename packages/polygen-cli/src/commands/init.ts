import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  findConfigFile,
  findProjectRoot,
} from '@callstack/polygen-config/find';
import chalk from 'chalk';
import { Command, Option } from 'commander';
import consola from 'consola';
import {
  type PackageManager,
  addDependency,
  detectPackageManager,
  installDependencies,
} from 'nypm';
import { oraPromise } from 'ora';
import pkg from '../../package.json' with { type: 'json' };
import defaultConfig from '../templates/default-polygen-config.js';

const command = new Command('init')
  .description('Initializes React Native WebAssembly in current directory')
  .addOption(new Option('-v, --verbose', 'Enable verbose output'));

interface Options {
  verbose: boolean;
}

const CONFIG_NAME = 'polygen.config.mjs';

/**
 * Subroutine for asking user whenever to add polygen dependency and its logic.
 *
 * @return Whenever dependencies changes (and `install` is required)
 */
async function maybeAddDeps(
  projectRoot: string,
  pm: PackageManager,
  options: Options
): Promise<boolean> {
  const { verbose } = options;
  const pkgJsonPath = path.join(projectRoot, 'package.json');
  const pkgJsonText = await fs.readFile(pkgJsonPath, 'utf8');

  const pkgJson = JSON.parse(pkgJsonText) as unknown;
  assert(
    typeof pkgJson === 'object' && pkgJson !== null,
    'Expected package.json to be an object'
  );

  const { dependencies = {} } = pkgJson as Record<string, unknown>;
  assert(
    typeof dependencies === 'object' && dependencies !== null,
    'Expected dependencies to be an object'
  );

  if ('@callstack/polygen' in dependencies) {
    consola.debug(
      "@callstack/polygen is already in project's dependencies, skipping..."
    );
    return false;
  }

  const shouldAdd = await consola.prompt(
    `Do you want to add Polygen to this project?`,
    {
      type: 'confirm',
      cancel: 'null',
    }
  );

  if (shouldAdd === null) {
    consola.info('Aborted');
    process.exit(1);
  }

  if (shouldAdd) {
    await oraPromise(
      () => addDependency('@callstack/polygen', { silent: !verbose }),
      'Adding Polygen'
    );
  } else {
    const addCommand = pm.name === 'yarn' ? 'add' : 'install';
    const command = `${pm.name} ${addCommand} @callstack/polygen`;
    consola.info(
      `You can install Polygen later by running: ${chalk.bold(command)}`
    );
  }

  return shouldAdd;
}

command.action(async (options: Options) => {
  consola.info(`Using ${chalk.bold.magenta(`Polygen ${pkg.version}`)}`);
  const projectRoot = await findProjectRoot();
  consola.info(`Found project at ${chalk.dim(projectRoot)}`);

  const configFile = await findConfigFile(projectRoot);
  if (configFile) {
    consola.info('Configuration file already exists');
  } else {
    try {
      consola.info(`Creating ${chalk.dim(CONFIG_NAME)}...`);
      await fs.writeFile(path.join(projectRoot, CONFIG_NAME), defaultConfig);
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
  consola.debug(`Detected package manager: ${pm.name} ${pm.version}`);

  // TODO: add to git directory

  let requiresInstall = await maybeAddDeps(projectRoot, pm, options);
  if (requiresInstall) {
    await installDependencies({ silent: !options.verbose });
  }

  const steps = [
    ' - Add your WebAssembly modules to your project',
    ` - Run ${chalk.bold('polygen scan')} to update modules index`,
    ` - Run ${chalk.bold('polygen generate')} to generate bindings`,
  ].join('\n');
  consola.box(`Next steps:\n${steps}`);

  // TODO: Add link to documentation
  // consola.log(``);
  // consola.log(`Polygen Documentation: ${chalk.underline('https://polygen.callstack.com')}`);
});

export default command;
