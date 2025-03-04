import path from 'path';
import type { Project } from './project';

/**
 * Helper type for accessing project paths
 */
export class ProjectPaths {
  private readonly project: Project;

  constructor(project: Project) {
    this.project = project;
  }

  public get configFileName(): string {
    return path.basename(this.project.configPath);
  }

  /**
   * Get full path to a file in the project
   *
   * @param components Path components
   */
  public pathTo(...components: string[]): string {
    return path.join(this.project.projectRoot, ...components);
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
    const fullProjectPath = path.join(
      this.project.projectRoot,
      directoryInProject
    );
    if (targetPath.startsWith(fullProjectPath)) {
      return targetPath.slice(fullProjectPath.length).replace(/^\/+/, '');
    }

    return targetPath;
  }

  /**
   * Local output directory
   */
  public get localOutputDirectory() {
    return this.project.options.output.directory;
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
