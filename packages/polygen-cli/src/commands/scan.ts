import {
  DependencyNotFoundError,
  PackageNotADependencyError,
  type Project,
  resolveProjectDependency,
} from '@callstack/polygen-project';
import chalk from 'chalk';
import { Argument, Option } from 'commander';
import consola from 'consola';
import { globby } from 'globby';
import { oraPromise } from 'ora';
import 'core-js/proposals/set-methods-v2.js';
import { ProjectCommand } from '../helpers/with-project-options.js';

interface Options {
  update: boolean;
}

const command = new ProjectCommand<Options>('scan')
  .description('Searches for WebAssembly modules in the project')
  .addArgument(
    new Argument('[package-name]', 'Optional name of external package')
  )
  .addOption(
    new Option('-u, --update', 'Automatically update polygen config file')
  );

async function scanLocal(project: Project): Promise<void> {
  const { paths: pathsToScan } = project.options.scan;

  const files = await oraPromise(
    () => globby(pathsToScan),
    'Scanning for WebAssembly modules'
  );

  const currentModules = new Set(
    project.modules.declaredLocalModules.map((m) => m.path)
  );
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

  if (added.size > 0) {
    consola.info(
      `To add them to the project, add following lines to your ${chalk.bold(project.paths.configFileName)}:`
    );
    consola.log(``);

    const indent = '    ';
    const diff = Array.from(added.values())
      .map((file) => `localModule('${file}'),`)
      .join(',\n' + indent);

    consola.log(chalk.gray('export default polygenConfig({'));
    consola.log(chalk.gray('  modules: ['));
    consola.log(chalk.gray('    // ...'));
    consola.log(chalk.green.bold('    ' + diff));
    consola.log(chalk.gray('    // ...'));
    consola.log(chalk.gray('  ]'));
    consola.log(chalk.gray('});'));
  }
}

async function scanExternal(
  project: Project,
  packageName: string
): Promise<void> {
  let packagePath: string | undefined;
  try {
    packagePath = await resolveProjectDependency(project, packageName);
  } catch (e) {
    if (e instanceof DependencyNotFoundError) {
      consola.error(
        `Could not find package ${chalk.bold(e.packageName)} in node_modules. Is it installed?`
      );
      return;
    }
    if (e instanceof PackageNotADependencyError) {
      consola.error(
        `Package ${chalk.bold(e.packageName)} is not a dependency of this project`
      );
      return;
    }

    throw e;
  }

  const files = await oraPromise(
    () => globby('**/*.wasm', { cwd: packagePath }),
    'Scanning for WebAssembly modules'
  );

  const currentModules = new Set(
    project.modules
      .getModulesOfExternalDependency(packageName)
      .map((m) => m.path)
  );
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

  if (added.size > 0) {
    consola.info(
      `To add them to the project, add following lines to your ${chalk.bold(project.paths.configFileName)}:`
    );
    consola.log(``);

    const indent = '    ';
    const diff = Array.from(added.values())
      .map((file) => `externalModule('${packageName}', '${file}'),`)
      .join(',\n' + indent);

    consola.log(chalk.gray('export default polygenConfig({'));
    consola.log(chalk.gray('  modules: ['));
    consola.log(chalk.gray('    // ...'));
    consola.log(chalk.green.bold('    ' + diff));
    consola.log(chalk.gray('    // ...'));
    consola.log(chalk.gray('  ]'));
    consola.log(chalk.gray('});'));
  }
}

command.action(async (project, options, packageName) => {
  if (packageName) {
    await scanExternal(project, packageName);
  } else {
    await scanLocal(project);
  }
});

export default command;
