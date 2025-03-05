import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PolygenModuleConfig } from '@callstack/polygen-config';
import type { Project, ResolvedModule } from '@callstack/polygen-project';
import { CodegenContext } from './codegen/context.js';
import type { W2CExternModule, W2CGeneratedModule } from './codegen/modules.js';
import { generateHostModuleBridge } from './generators/host.js';
import { generateImportedModuleBridge } from './generators/import-bridge.js';
import { generateModuleExportsBridge } from './generators/module-bridge.js';
import {
  OutputGenerator,
  type WrittenFilesMap,
} from './helpers/output-generator.js';
import { cocoapods } from './pipeline/react-native/cocoapods.js';
import { metroResolver } from './pipeline/react-native/metro.js';
import type {
  AllModulesGeneratedContext,
  ModuleGeneratedContext,
  Plugin,
} from './plugin.js';

const DEFAULT_PLUGINS: Plugin[] = [cocoapods(), metroResolver()];

export {
  FileExternallyChangedError,
  FileOverwriteError,
} from './helpers/output-generator.js';

const UMBRELLA_PROJECT_NAME = '@host';

const ASSETS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../assets'
);

/**
 * Options used to change W2CGenerator behavior.
 */
export interface CodegenOptions {
  /**
   * Path to output directory where generated files will be created.
   *
   * Directories for specific modules will be created within this
   * directory.
   */
  outputDirectory?: string;

  /**
   * If true, all modules are built into single turbo module.
   *
   * This can increase build times if one of the WASM module was changed.
   * This only works with static linking.
   *
   * TODO: Currently only this works
   *
   * @defaultValue true
   */
  singleProject?: boolean;

  /**
   * If true, generated files are re-generated and written
   * even if stale.
   *
   * @defaultValue false
   */
  forceGenerate?: boolean;

  /**
   * If true, additional debug metadata files are generated alongside
   * output source files.
   *
   * @defaultValue false
   */
  generateMetadata?: boolean;
}

export interface PluginDispatchOptions {
  beforePluginDispatch?: (plugin: Plugin) => Promise<unknown> | unknown;
  afterPluginDispatch?: (plugin: Plugin) => Promise<unknown> | unknown;
}

/**
 * Main generator class for WebAssembly to C code generation.
 *
 * This class is responsible for generating C code from WebAssembly modules, and
 * contains all state and configuration necessary for the generation process.
 *
 * The generator is not reentrant, and should be used only once.
 */
export class Codegen {
  /**
   * The project configuration to generate code for.
   */
  public readonly project: Project;

  /**
   * Configuration options for the generation process.
   */
  public readonly options: CodegenOptions;

  /**
   * Output generator instance used to write generated files to disk.
   */
  public readonly generator: OutputGenerator;

  /**
   * Shared context for all modules.
   *
   * Holds codegen state and module information.
   */
  public readonly context: CodegenContext;

  /**
   * Collection of plugins to dispatch.
   */
  public plugins: Plugin[];

  /**
   * Creates a new W2CGenerator instance for the specified project and options.
   *
   * @see create
   */
  private constructor(
    project: Project,
    options: CodegenOptions = {},
    previousWrittenFiles?: WrittenFilesMap,
    plugins?: Plugin[]
  ) {
    this.project = project;
    this.options = options;
    this.context = new CodegenContext();
    this.plugins = plugins ?? DEFAULT_PLUGINS;
    this.generator = new OutputGenerator(
      {
        outputDirectory: this.outputDirectory,
        assetsDirectory: ASSETS_DIR,
        forceGenerate: options.forceGenerate,
      },
      previousWrittenFiles
    );
  }

  /**
   * Creates a new W2CGenerator instance for the specified project and options.
   *
   * @param project The project configuration to generate code for.
   * @param options Optional configuration for the generation process.
   */
  public static async create(
    project: Project,
    options: CodegenOptions = {}
  ): Promise<Codegen> {
    let previouslyWrittenFiles: WrittenFilesMap | undefined;
    try {
      const outputDir =
        options.outputDirectory ?? project.paths.fullOutputDirectory;
      const previousMap = await fs.readFile(
        path.join(outputDir, 'polygen-output.json'),
        { encoding: 'utf-8' }
      );
      previouslyWrittenFiles = JSON.parse(previousMap).files;
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code !== 'ENOENT') {
        throw e;
      }
    }

    return new Codegen(project, options, previouslyWrittenFiles);
  }

  /**
   * Path to output directory where generated files will be created.
   */
  public get outputDirectory(): string {
    return (
      this.options.outputDirectory ?? this.project.paths.fullOutputDirectory
    );
  }

  /**
   * Generates all code for specified WebAssembly module.
   *
   * This includes generating the module exports bridge and the JavaScript
   *
   * @param module The module configuration to generate code for.
   */
  async generateModule(
    module: ResolvedModule,
    options: PluginDispatchOptions = {}
  ): Promise<[W2CGeneratedModule, W2CExternModule[]]> {
    const [moduleContext, imports] = await this.context.addModule(module);
    const generator = this.generator.forPath(
      this.outputPathForModule(module, moduleContext.name)
    );
    await generateModuleExportsBridge(generator, moduleContext, {
      forceGenerate: this.options.forceGenerate,
    });

    const pluginContext: ModuleGeneratedContext = {
      codegen: this,
      output: generator,
      context: moduleContext,
      module,
    };

    for (const plugin of this.plugins) {
      await options.beforePluginDispatch?.(plugin);
      await plugin.moduleGenerated?.(pluginContext);
      await options.afterPluginDispatch?.(plugin);
    }

    return [moduleContext, imports];
  }

  /**
   * Generates the host module and its corresponding bridges using the specified context and options.
   *
   * @param context The shared context containing module information and configurations.
   * @return A promise that resolves with the results of generating bridges for imported modules. Each promise result contains the status of the operation (fulfilled or rejected).
   */
  async generateHostModule() {
    const generator = this.generator.forPath(UMBRELLA_PROJECT_NAME);
    await generateHostModuleBridge(generator, this.context.modules);
  }

  /**
   * Generates the imported module by creating necessary files and configurations in the specified output directory.
   *
   * @param module The imported module data that needs to be processed and generated.
   * @return A promise that resolves when the module generation process is completed.
   */
  async generateImportedModule(module: W2CExternModule) {
    const generator = this.generator.forPath(UMBRELLA_PROJECT_NAME);
    await generateImportedModuleBridge(generator.forPath(`imports`), module);
  }

  /**
   * Finalizes the generation process by writing the generated files to the output directory.
   */
  async finalize() {
    const pluginContext: AllModulesGeneratedContext = {
      codegen: this,
      output: this.generator,
    };

    for (const plugin of this.plugins) {
      await plugin.finalizeCodegen?.(pluginContext);
    }

    const generatedMapPath = this.generator.outputPathTo('polygen-output.json');
    const contents = {
      files: this.generator.writtenFiles,
    };

    await fs.writeFile(
      generatedMapPath,
      JSON.stringify(contents, undefined, 2)
    );
  }

  private outputPathForModule(module: PolygenModuleConfig, name: string) {
    let dirName =
      module.kind === 'external' ? `${module.packageName}#${name}` : name;
    if (this.options.singleProject) {
      return path.join(UMBRELLA_PROJECT_NAME, dirName);
    }

    return dirName;
  }
}
