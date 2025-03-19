import chalk from 'chalk';
import consola from 'consola';
import { cleanGeneratedFiles } from '../actions/clean.js';
import { ProjectCommand } from '../helpers/with-project-options.js';

interface Options {
  yes: boolean;
}

const command = new ProjectCommand<Options>('clean')
  .description('Cleans all WASM generated output files')
  .option('-y, --yes', 'Remove files without confirmation');

command.action(async (project, options) => {
  let confirmed = options.yes;
  const displayPath = project.paths.localOutputDirectory;

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

  await cleanGeneratedFiles(project);

  consola.success('Generated files removed!');
});

export default command;
