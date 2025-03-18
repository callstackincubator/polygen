import path from 'node:path';
import type {
  PolygenExternalModuleConfig,
  PolygenLocalModuleConfig,
  PolygenModuleConfig,
} from '@callstack/polygen-config';
import { resolveProjectDependency } from './deps';
import type { Project } from './project';
import type { ResolvedExternalModule, ResolvedLocalModule } from './types';

export type Resolved<TModule extends PolygenModuleConfig> =
  TModule extends PolygenLocalModuleConfig
    ? ResolvedLocalModule
    : ResolvedExternalModule;

/**
 * Helper class for managing project modules.
 */
export class ProjectModules {
  private readonly project: Project;

  private resolvedModuleCache: WeakMap<
    PolygenModuleConfig,
    Resolved<PolygenModuleConfig>
  > = new WeakMap();

  public constructor(project: Project) {
    this.project = project;
  }

  /**
   * Get all WebAssembly modules in the project
   */
  public get webAssemblyModules(): PolygenModuleConfig[] {
    return this.project.options.modules;
  }

  /**
   * Declared Local modules
   */
  public get declaredLocalModules(): PolygenLocalModuleConfig[] {
    return this.project.options.modules.filter((m) => m.kind === 'local');
  }

  /**
   * Local modules
   */
  public async getLocalModules(): Promise<ResolvedLocalModule[]> {
    const promises = this.declaredLocalModules.map((e) =>
      this.resolvePolygenModule(e)
    );
    return Promise.all(promises);
  }

  /**
   * Declared external modules
   */
  public get declaredExternalModules(): PolygenExternalModuleConfig[] {
    return this.project.options.modules.filter((m) => m.kind === 'external');
  }

  /**
   * External modules
   */
  public async getExternalModules(): Promise<ResolvedExternalModule[]> {
    const promises = this.declaredExternalModules.map((e) =>
      this.resolvePolygenModule(e)
    );
    return Promise.all(promises);
  }

  /**
   * Gets external webassembly modules from specified package
   *
   * @param packageName Name of the package
   */
  public getModulesOfExternalDependency(
    packageName: string
  ): PolygenExternalModuleConfig[] {
    return this.declaredExternalModules.filter(
      (m) => m.packageName === packageName
    );
  }

  /**
   * Returns specified module with resolved path.
   *
   * @param project
   * @param module
   */
  public async resolvePolygenModule<TModule extends PolygenModuleConfig>(
    module: TModule
  ): Promise<Resolved<TModule>> {
    const cached = this.resolvedModuleCache.get(module);
    if (cached) {
      return cached as Resolved<TModule>;
    }

    const resolvedPath = await this.resolvePathToModule(module);
    const resolvedModule: Resolved<TModule> = {
      ...module,
      resolvedPath,
    } as unknown as Resolved<TModule>;
    this.resolvedModuleCache.set(module, resolvedModule);
    return resolvedModule;
  }

  /**
   * Resolves path to the specified module.
   *
   * @param module Module to resolve path for
   */
  private async resolvePathToModule(
    module: PolygenModuleConfig
  ): Promise<string> {
    switch (module.kind) {
      case 'local':
        return this.project.paths.pathTo(module.path);
      case 'external':
        const modulePath = module.path;
        const packagePath = await resolveProjectDependency(
          this.project,
          module.packageName
        );
        return path.join(packagePath, modulePath);
    }
  }
}
