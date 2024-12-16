import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project } from '@callstack/polygen-core-build';
import { W2CModuleContext } from './context/context.js';
import { W2CImportedModule, W2CSharedContext } from './context/index.js';
import { generateHostModuleBridge } from './generators/host.js';
import { generateImportedModuleBridge } from './generators/import-bridge.js';
import { generateModuleExportsBridge } from './generators/module-bridge.js';
import { generateWasmJSModuleSource } from './generators/wasm-module.js';
import { OutputGenerator } from './helpers/output-generator.js';

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
  outputDirectory: string;

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

/**
 * Generates all code for specified WebAssembly module.
 */
export async function generateModule(
  modulePath: string,
  options: W2CGeneratorOptions
): Promise<W2CModuleContext> {
  const moduleContents = await fs.readFile(modulePath, { encoding: null });
  const module = new W2CModuleContext(
    moduleContents.buffer as ArrayBuffer,
    modulePath
  );
  const moduleOutputDir = outputPathForModule(module.name, options);
  const generator = new OutputGenerator({
    outputDirectory: moduleOutputDir,
    assetsDirectory: ASSETS_DIR,
  });

  await generateModuleExportsBridge(generator, module, {
    renderMetadata: options.generateMetadata,
    forceGenerate: options.forceGenerate,
    hackAutoNumberCoerce: options.hackAutoNumberCoerce,
  });

  return module;
}

/**
 * Generates the host module and its corresponding bridges using the specified context and options.
 *
 * @param context The shared context containing module information and configurations.
 * @param options The generator options, including output directory and other configurations.
 * @return A promise that resolves with the results of generating bridges for imported modules. Each promise result contains the status of the operation (fulfilled or rejected).
 */
export async function generateHostModule(
  context: W2CSharedContext,
  options: W2CGeneratorOptions
) {
  const moduleOutputDir = path.join(
    options.outputDirectory,
    UMBRELLA_PROJECT_NAME
  );
  const generator = new OutputGenerator({
    outputDirectory: moduleOutputDir,
    assetsDirectory: ASSETS_DIR,
  });

  await generateHostModuleBridge(generator, context.modules);
}

/**
 * Generates the imported module by creating necessary files and configurations in the specified output directory.
 *
 * @param module The imported module data that needs to be processed and generated.
 * @param options The generator options that include the output directory and other configurations.
 * @return A promise that resolves when the module generation process is completed.
 */
export async function generateImportedModule(
  module: W2CImportedModule,
  options: W2CGeneratorOptions
) {
  const moduleOutputDir = path.join(
    options.outputDirectory,
    UMBRELLA_PROJECT_NAME
  );

  const generator = new OutputGenerator({
    outputDirectory: moduleOutputDir,
    assetsDirectory: ASSETS_DIR,
  });

  await generateImportedModuleBridge(generator.forPath(`imports`), module);
}

/**
 * Generates a JavaScript module file for a given WebAssembly (.wasm) module.
 * The generated module will be placed under the project's output directory.
 *
 * @param project - The project instance that provides path resolution and output configuration.
 * @param pathToModule - The file path to the WebAssembly (.wasm) module that needs to be processed.
 * @return A promise that resolves when the JavaScript module file is successfully created.
 */
export async function generateWasmJSModule(
  project: Project,
  pathToModule: string
) {
  const cleanName = path.basename(pathToModule, '.wasm');
  const pathInModule = project.globalPathToLocal(
    pathToModule,
    project.localSourceDir
  );
  const dirnameInModule = path.dirname(pathInModule);
  const generatedModulePath = path.join(
    project.fullOutputDirectory,
    'modules',
    dirnameInModule,
    `${cleanName}.js`
  );

  await fs.mkdir(path.dirname(generatedModulePath), { recursive: true });
  const source = await generateWasmJSModuleSource(pathToModule);
  await fs.writeFile(generatedModulePath, source, 'utf8');
}

function outputPathForModule(moduleName: string, options: W2CGeneratorOptions) {
  if (options.singleProject) {
    return path.join(
      options.outputDirectory,
      UMBRELLA_PROJECT_NAME,
      moduleName
    );
  }

  return path.join(options.outputDirectory, moduleName);
}
