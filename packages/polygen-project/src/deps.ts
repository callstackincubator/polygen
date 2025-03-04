import fs from 'node:fs/promises';
import findUp from 'find-up';
import type { Project } from './project.js';

/**
 * Error thrown when specified package is not a dependency of the project.
 */
export class PackageNotADependencyError extends Error {
  constructor(public packageName: string) {
    super(`Package ${packageName} is not a dependency of this project`);
  }
}

/**
 * Error thrown when specified dependency is not found in node_modules.
 *
 * This error is thrown when we are unable to resolve a dependency.
 */
export class DependencyNotFoundError extends Error {
  constructor(public packageName: string) {
    super(
      `Could not find package ${packageName} in node_modules. Is it installed?`
    );
  }
}

/**
 * Reads project's `package.json`.
 *
 * @param project Project to read package.json from
 * @returns Parsed package.json
 */
export async function getPackageJson(
  project: Project
): Promise<Record<string, any>> {
  return JSON.parse(
    await fs.readFile(project.paths.pathTo('package.json'), 'utf-8')
  );
}

/**
 * Resolves a dependency of the project.
 *
 * @param project Project to resolve dependency for
 * @param packageName Name of the package to resolve
 * @returns Path to the resolved dependency
 *
 * @throws {PackageNotADependencyError} When specified package is not a dependency of the project
 * @throws {DependencyNotFoundError} When specified dependency is not found in node_modules
 */
export async function resolveProjectDependency(
  project: Project,
  packageName: string
) {
  const { dependencies = {}, devDependencies = {} } =
    await getPackageJson(project);

  if (dependencies[packageName] == null && devDependencies[packageName]) {
    throw new PackageNotADependencyError(packageName);
  }

  const resolved = await findUp(`node_modules/${packageName}`, {
    type: 'directory',
    cwd: project.projectRoot,
    allowSymlinks: true,
  });
  if (!resolved) {
    throw new DependencyNotFoundError(packageName);
  }

  return resolved;
}
