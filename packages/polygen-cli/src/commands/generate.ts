import {
  FileExternallyChangedError,
  FileOverwriteError,
} from '@callstack/polygen-codegen';
import { Project } from '@callstack/polygen-project';
import chalk from 'chalk';
import { Command, Option } from 'commander';
import consola from 'consola';
import { type GenerateOptions, generate } from '../actions/codegen.js';

const command = new Command('generate')
  .description('Generates React Native Modules from Wasm')
  .addOption(
    new Option('-p, --project <projectDir>', 'Path to Polygen project')
  )
  .addOption(
    new Option('-o, --output-dir <outputDir>', 'Path to output directory')
  )
  .addOption(new Option('-f, --force', 'Generate code even if not outdated'));

interface CommandOptions extends GenerateOptions {
  project?: string;
}

command.action(async (options: CommandOptions) => {
  const project = await (options.project
    ? Project.fromPath(options.project)
    : Project.findClosest());
  if (options.outputDir) {
    consola.info(`Using ${chalk.dim(options.outputDir)} as output directory`);
    project.updateOptionsInMemory({ output: { directory: options.outputDir } });
  }

  if (options.force) {
    consola.warn('Using force overwrite flag, all files will be overwritten');
  }

  try {
    await generate(options, project);
  } catch (error: unknown) {
    if (error instanceof FileExternallyChangedError) {
      consola.error(
        `File ${chalk.magenta(error.path)} has been changed externally`
      );
      consola.info(
        `Use ${chalk.bold('-f')} flag to force generate and overwrite files`
      );
    } else if (error instanceof FileOverwriteError) {
      consola.error(
        `File ${chalk.magenta(error.path)} already exists and would be overwritten`
      );
      consola.info(
        `Use ${chalk.bold('-f')} flag to force generate and overwrite files`
      );
    } else {
      consola.error('Error generating modules:', error);
    }
  }
});

export default command;
