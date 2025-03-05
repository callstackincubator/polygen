import fs from 'node:fs/promises';
// TODO: clean only generated files (not whole directory)
import type { Project } from '@callstack/polygen-project';
import chalk from 'chalk';
import { oraPromise } from 'ora';

export async function cleanGeneratedFiles(project: Project): Promise<void> {
  const {
    fullOutputDirectory: generatedPath,
    localOutputDirectory: displayPath,
  } = project.paths;

  await oraPromise(
    fs.rm(generatedPath, { recursive: true, force: true }),
    `Removing ${chalk.bold(displayPath)}`
  );
}
