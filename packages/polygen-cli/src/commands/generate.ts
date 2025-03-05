import {
  FileExternallyChangedError,
  FileOverwriteError,
} from '@callstack/polygen-codegen';
import chalk from 'chalk';
import { Option } from 'commander';
import consola from 'consola';
import { cleanGeneratedFiles } from '../actions/clean.js';
import { type GenerateOptions, generate } from '../actions/codegen.js';
import { ProjectCommand } from '../helpers/with-project-options.js';

interface CommandOptions extends GenerateOptions {
  clean?: boolean;
}

const command = new ProjectCommand<CommandOptions>('generate')
  .description('Generates React Native Modules from Wasm')
  .addOption(new Option('--clean', 'Clean output before generating'))
  .addOption(
    new Option('-o, --output-dir <outputDir>', 'Path to output directory')
  )
  .addOption(new Option('-f, --force', 'Generate code even if not outdated'));

command.action(async (project, options) => {
  if (options.outputDir) {
    consola.info(`Using ${chalk.dim(options.outputDir)} as output directory`);
    project.updateOptionsInMemory({ output: { directory: options.outputDir } });
  }

  if (options.force) {
    consola.warn('Using force overwrite flag, all files will be overwritten');
  }

  if (options.clean) {
    await cleanGeneratedFiles(project);
    consola.info('Cleaned generated files');
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
