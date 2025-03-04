import type { ResolvedPolygenConfig } from '@callstack/polygen-config';
import {
  InvalidProjectConfigurationError,
  ProjectConfigurationNotFound,
  findConfigFile,
  findConfigFileSync,
  findProjectRoot,
  findProjectRootSync,
} from '@callstack/polygen-config/find';
import deepmerge from 'deepmerge';
import { ProjectModules } from './project.modules';
import { ProjectPaths } from './project.paths';

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
   * Path to determined configuration file
   */
  public readonly configPath: string;

  /**
   * Project options specified by the user
   */
  public options: ResolvedPolygenConfig;

  /**
   * Helper object for accessing project paths
   */
  public readonly paths: ProjectPaths = new ProjectPaths(this);

  public readonly modules: ProjectModules = new ProjectModules(this);

  private constructor(
    projectRoot: string,
    configPath: string,
    options: ResolvedPolygenConfig
  ) {
    this.projectRoot = projectRoot;
    this.configPath = configPath;
    this.options = options;
  }

  /**
   * Creates a project from nearest package.json.
   *
   * @param from Directory to start looking from, defaults to current directory.
   * @returns Promise with Project instance
   *
   * @see findClosestSync Synchronous version
   */
  static async findClosest(from?: string): Promise<Project> {
    const projectRoot = await findProjectRoot(from);
    return Project.fromPath(projectRoot);
  }

  /**
   * Creates a project from nearest package.json, synchronously.
   *
   * @param from Directory to start looking from, defaults to current directory.
   * @returns Promise with Project instance
   *
   * @see findClosest Asynchronous version
   */
  static findClosestSync(from?: string): Project {
    const projectRoot = findProjectRootSync(from);
    return Project.fromPathSync(projectRoot);
  }

  /**
   * Creates a project from specified project root path.
   *
   * @param projectRoot Path to the project
   * @returns Promise with Project instance
   *
   * @see fromPathSync Synchronous version
   */
  static async fromPath(projectRoot: string): Promise<Project> {
    const configPath = await findConfigFile(projectRoot);
    if (!configPath) {
      throw new ProjectConfigurationNotFound();
    }

    try {
      const config = configPath ? (await import(configPath)).default : {};
      return new Project(projectRoot, configPath, config);
    } catch (e) {
      throw new InvalidProjectConfigurationError(
        `Failed to load config from ${configPath}`,
        e
      );
    }
  }

  /**
   * Creates a project from specified project root path, synchronously.
   *
   * @param projectRoot Path to the project
   * @returns Project instance
   *
   * @see fromPath Asynchronous version
   */
  static fromPathSync(projectRoot: string): Project {
    const configPath = findConfigFileSync(projectRoot);
    if (!configPath) {
      throw new ProjectConfigurationNotFound();
    }

    try {
      const config = configPath ? require(configPath).default : {};
      return new Project(projectRoot, configPath, config);
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
}
