import path from 'path';
import { glob } from 'glob';
import {
  findConfigFile,
  findConfigFileSync,
  findProjectRoot,
  findProjectRootSync,
} from './helpers.js';

export interface ProjectOptions {
  outputDirectory?: string;
}

/**
 * Represents a local project
 */
export class Project {
  public readonly projectRoot: string;
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

  public async getWebAssemblyModules(): Promise<string[]> {
    // TODO: support static list from config
    return glob('**/*.wasm', { cwd: this.fullSourceDir });
  }

  public get localOutputDirectory() {
    return this.options.outputDirectory ?? 'node_modules/.polygen-out';
  }

  public get fullOutputDirectory() {
    return this.pathTo(this.localOutputDirectory);
  }

  public get localSourceDir(): string {
    return 'src';
  }

  public get fullSourceDir(): string {
    return this.pathToSource();
  }
}
