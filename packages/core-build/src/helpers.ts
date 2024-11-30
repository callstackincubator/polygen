import { findUp, findUpSync } from 'find-up';
import { UnknownProjectError } from './errors.js';
import path from 'path';
import fs from 'node:fs/promises';
import fsClassic from 'node:fs';

/**
 * Finds project root that contains a `package.json`.
 *
 * @see findProjectRootSync Synchronous version of this function
 *
 * @throws UnknownProjectError If no package.json was found
 * @param from Directory path to start looking from, default to current directory
 */
export async function findProjectRoot(
  from: string = process.cwd()
): Promise<string> {
  const packageJsonPath = await findUp('package.json', { cwd: from });

  if (!packageJsonPath) {
    throw new UnknownProjectError('Could not locate package.json');
  }

  return path.dirname(packageJsonPath);
}

/**
 * Finds project root that contains a `package.json`, synchronously.
 *
 * @see findProjectRoot Asynchronous version of this function
 *
 * @throws UnknownProjectError If no package.json was found
 * @param from Directory path to start looking from, default to current directory
 */
export function findProjectRootSync(from: string = process.cwd()): string {
  const packageJsonPath = findUpSync('package.json', { cwd: from });

  if (!packageJsonPath) {
    throw new UnknownProjectError('Could not locate package.json');
  }

  return path.dirname(packageJsonPath);
}

const CONFIG_FILE_NAMES = [
  'polygen-config.ejs',
  'polygen-config.js',
  'polygen-config.cjs',
];

/**
 * Finds correct configuration file name to import
 *
 * @param dirPath Directory to look for configuration files
 * @return Found configuration file name, or null if none
 *
 * @see findConfigFileSync
 */
export async function findConfigFile(dirPath: string): Promise<string | null> {
  for (const fileName of CONFIG_FILE_NAMES) {
    try {
      const configFile = path.join(dirPath, fileName);
      await fs.access(configFile);
      return configFile;
    } catch {}
  }

  return null;
}

/**
 * Finds correct configuration file name to import, synchronously
 *
 * @param dirPath Directory to look for configuration files
 * @return Found configuration file name, or null if none
 *
 * @see findConfigFile
 */
export function findConfigFileSync(dirPath: string): string | null {
  for (const fileName of CONFIG_FILE_NAMES) {
    const configFile = path.join(dirPath, fileName);
    if (fsClassic.existsSync(configFile)) {
      return configFile;
    }
  }

  return null;
}
