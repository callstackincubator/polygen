import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project } from '@callstack/polygen-config/project';
import { W2CModuleContext } from './context/context.js';
import { W2CImportedModule, W2CSharedContext } from './context/index.js';
import { generateHostModuleBridge } from './generators/host.js';
import { generateImportedModuleBridge } from './generators/import-bridge.js';
import { generateModuleExportsBridge } from './generators/module-bridge.js';
import { generateWasmJSModuleSource } from './generators/wasm-module.js';
import {
  OutputGenerator,
  WrittenFilesMap,
} from './helpers/output-generator.js';

export {
  FileExternallyChangedError,
  FileOverwriteError,
} from './helpers/output-generator.js';

const UMBRELLA_PROJECT_NAME = '@host';

const ASSETS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../assets'
);

/**
 * Options used to change W2CGenerator behavior.
 */
export interface W2CGeneratorOptions {
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

  hackAutoNumberCoerce?: boolean;
}

export class W2CGenerator {
  public readonly project: Project;
  public readonly options: W2CGeneratorOptions;
  public readonly generator: OutputGenerator;
  public readonly generatedModules: W2CModuleContext[] = [];

  private constructor(
    project: Project,
    options: W2CGeneratorOptions = {},
    previousWrittenFiles?: WrittenFilesMap
  ) {
    this.project = project;
    this.options = options;
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
   */
  public static async create(
    project: Project,
    options: W2CGeneratorOptions = {}
  ): Promise<W2CGenerator> {
    let previouslyWrittenFiles: WrittenFilesMap | undefined;
    try {
      const outputDir = options.outputDirectory ?? project.fullOutputDirectory;
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

    return new W2CGenerator(project, options, previouslyWrittenFiles);
  }

  /**
   * Path to output directory where generated files will be created.
   */
  public get outputDirectory(): string {
    return this.options.outputDirectory ?? this.project.fullOutputDirectory;
  }

  /**
   * Generates all code for specified WebAssembly module.
   */
  async generateModule(modulePath: string): Promise<W2CModuleContext> {
    const moduleContents = await fs.readFile(modulePath, { encoding: null });
    const module = new W2CModuleContext(
      moduleContents.buffer as ArrayBuffer,
      modulePath
    );
    const generator = this.generator.forPath(
      this.outputPathForModule(module.name)
    );
    await generateModuleExportsBridge(generator, module, {
      renderMetadata: this.options.generateMetadata,
      forceGenerate: this.options.forceGenerate,
      hackAutoNumberCoerce: this.options.hackAutoNumberCoerce,
    });

    this.generatedModules.push(module);
    await this.generateWasmJSModule(modulePath);

    return module;
  }

  /**
   * Generates a JavaScript module file for a given WebAssembly (.wasm) module.
   * The generated module will be placed under the project's output directory.
   *
   * @param pathToModule - The file path to the WebAssembly (.wasm) module that needs to be processed.
   * @return A promise that resolves when the JavaScript module file is successfully created.
   */
  async generateWasmJSModule(pathToModule: string) {
    const cleanName = path.basename(pathToModule, '.wasm');
    const pathInModule = this.project.globalPathToLocal(
      pathToModule,
      this.project.localSourceDir
    );
    const dirnameInModule = path.dirname(pathInModule);
    const generatedModulePath = path.join(dirnameInModule, `${cleanName}.js`);

    const generator = this.generator.forPath('modules');
    const source = await generateWasmJSModuleSource(pathToModule);
    await generator.writeTo(generatedModulePath, source);
  }

  /**
   * Generates the host module and its corresponding bridges using the specified context and options.
   *
   * @param context The shared context containing module information and configurations.
   * @return A promise that resolves with the results of generating bridges for imported modules. Each promise result contains the status of the operation (fulfilled or rejected).
   */
  async generateHostModule(context: W2CSharedContext) {
    const generator = this.generator.forPath(UMBRELLA_PROJECT_NAME);
    await generateHostModuleBridge(generator, context.modules);
  }

  /**
   * Generates the imported module by creating necessary files and configurations in the specified output directory.
   *
   * @param module The imported module data that needs to be processed and generated.
   * @return A promise that resolves when the module generation process is completed.
   */
  async generateImportedModule(module: W2CImportedModule) {
    const generator = this.generator.forPath(UMBRELLA_PROJECT_NAME);
    await generateImportedModuleBridge(generator.forPath(`imports`), module);
  }

  /**
   * Finalizes the generation process by writing the generated files to the output directory.
   */
  async finalize() {
    const generatedMapPath = this.generator.outputPathTo('polygen-output.json');
    const contents = {
      files: this.generator.writtenFiles,
    };

    await fs.writeFile(
      generatedMapPath,
      JSON.stringify(contents, undefined, 2)
    );
  }

  private outputPathForModule(moduleName: string) {
    if (this.options.singleProject) {
      return path.join(UMBRELLA_PROJECT_NAME, moduleName);
    }

    return moduleName;
  }
}
