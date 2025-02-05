import path from 'path';
import deepmerge from 'deepmerge';
import { glob } from 'glob';
import {
  InvalidProjectConfigurationError,
  findConfigFile,
  findConfigFileSync,
  findProjectRoot,
  findProjectRootSync,
} from './find-config';
import { type ResolvedPolygenConfig } from './index';

export * from './find-config';

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Represents a local project
 */
export class Project {
  /**
   * Root directory of the project
   */
  public readonly projectRoot: string;

  /**
   * Project options specified by the user
   */
  public options: ResolvedPolygenConfig;

  constructor(projectRoot: string, options: ResolvedPolygenConfig) {
    this.projectRoot = projectRoot;
    this.options = options;
  }

  /**
   * Creates a project from closes package.json
   *
   * @param from Directory to start looking from, defaults to current directory.
   * @returns Promise with Project instance
   *
   * @see findClosestSync Synchronous version
   */
  static async findClosest(from?: string): Promise<Project> {
    const projectRoot = await findProjectRoot(from);
    const configPath = await findConfigFile(projectRoot);
    try {
      const config = configPath ? (await import(configPath)).default : {};
      return new Project(projectRoot, config);
    } catch (e) {
      throw new InvalidProjectConfigurationError(
        `Failed to load config from ${configPath}`,
        e
      );
    }
  }

  /**
   * Creates a project from closes package.json, synchronously
   *
   * @param from Directory to start looking from, defaults to current directory.
   * @returns Promise with Project instance
   *
   * @see findClosest Asynchronous version
   */
  static findClosestSync(from?: string): Project {
    const projectRoot = findProjectRootSync(from);
    const configPath = findConfigFileSync(projectRoot);
    try {
      const config = configPath ? require(configPath) : {};
      return new Project(projectRoot, config);
    } catch (e) {
      throw new InvalidProjectConfigurationError(
        `Failed to load config from ${configPath}`,
        e
      );
    }
  }

  public updateOptionsInMemory(options: DeepPartial<ResolvedPolygenConfig>) {
    this.options = deepmerge(this.options, options) as ResolvedPolygenConfig;
  }

  /**
   * Get full path to a file in the project
   *
   * @param components Path components
   */
  public pathTo(...components: string[]): string {
    return path.join(this.projectRoot, ...components);
  }

  /**
   * Get full path to a file in the source directory
   *
   * @param components Path components
   */
  public pathToSource(...components: string[]): string {
    return this.pathTo(this.localSourceDir, ...components);
  }

  /**
   * Get full path to a file in the output directory
   *
   * @param components Path components
   */
  public pathToOutput(...components: string[]): string {
    return this.pathTo(this.localOutputDirectory, ...components);
  }

  /**
   * Convert a global path to a local path
   *
   * @param targetPath Global path
   * @param directoryInProject Directory in the project to consider as root
   */
  public globalPathToLocal(
    targetPath: string,
    directoryInProject: string = ''
  ): string {
    const fullProjectPath = path.join(this.projectRoot, directoryInProject);
    if (targetPath.startsWith(fullProjectPath)) {
      return targetPath.slice(fullProjectPath.length).replace(/^\/+/, '');
    }

    return targetPath;
  }

  /**
   * Get all WebAssembly modules in the project
   */
  public async getWebAssemblyModules(): Promise<string[]> {
    // TODO: support static list from config
    return glob('**/*.wasm', { cwd: this.fullSourceDir });
  }

  /**
   * Local output directory
   */
  public get localOutputDirectory() {
    return this.options.output.directory;
  }

  /**
   * Full path to the output directory
   */
  public get fullOutputDirectory() {
    return this.pathTo(this.localOutputDirectory);
  }

  /**
   * Local source directory
   */
  public get localSourceDir(): string {
    return 'src';
  }

  /**
   * Full path to the source directory
   */
  public get fullSourceDir(): string {
    return this.pathToSource();
  }
}
