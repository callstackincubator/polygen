import path from 'path';
import { glob } from 'glob';
import {
  findConfigFile,
  findConfigFileSync,
  findProjectRoot,
  findProjectRootSync,
} from './helpers.js';

/**
 * Options that can be defined
 */
export interface ProjectOptions {
  /**
   * Output directory for generated files.
   */
  outputDirectory?: string;
}

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
  public readonly options: ProjectOptions;

  constructor(projectRoot: string, options: ProjectOptions) {
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
    const config = configPath ? await import(configPath) : {};
    return new Project(projectRoot, config);
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
    const config = configPath ? require(configPath) : {};
    return new Project(projectRoot, config);
  }

  public updateOptionsInMemory(options: Partial<ProjectOptions>) {
    Object.assign(this.options, options);
  }

  public pathTo(...components: string[]): string {
    return path.join(this.projectRoot, ...components);
  }

  public pathToSource(...components: string[]): string {
    return this.pathTo(this.localSourceDir, ...components);
  }

  public pathToOutput(...components: string[]): string {
    return this.pathTo(this.localOutputDirectory, ...components);
  }

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
    return this.options.outputDirectory ?? 'node_modules/.polygen-out';
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
