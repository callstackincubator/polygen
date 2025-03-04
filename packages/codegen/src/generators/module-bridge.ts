import consola from 'consola';
import type { W2CGeneratedModule } from '../codegen/modules.js';
import type { OutputGenerator } from '../helpers/output-generator.js';
import * as templates from '../templates/library/index.js';
import { generateCSources, getOutputFilesFor } from '../wasm2c/wasm2c.js';

export interface ModuleGeneratorOptions {
  forceGenerate?: boolean;
}

export async function generateModuleExportsBridge(
  generator: OutputGenerator,
  module: W2CGeneratedModule,
  options: ModuleGeneratorOptions
) {
  try {
    // TODO; remove generated files on dev (or always)
    await Promise.allSettled([
      generateCSource(generator, module, options),
      generateJSIBridge(generator, module),
    ]);
  } catch (e) {
    consola.error(e);
  }
}

async function generateCSource(
  generator: OutputGenerator,
  module: W2CGeneratedModule,
  options: ModuleGeneratorOptions
) {
  const outputPath = generator.outputPathTo(module.name);
  const generatedFiles = getOutputFilesFor(module.sourceModulePath, outputPath);

  return generatingFromModule(generator, module, options, generatedFiles, () =>
    generateCSources(module.sourceModulePath, outputPath)
  );
}

async function generateJSIBridge(
  generator: OutputGenerator,
  module: W2CGeneratedModule
) {
  await generator.writeAllTo({
    'jsi-exports-bridge.h': templates.buildExportBridgeHeader(module),
    'jsi-exports-bridge.cpp': templates.buildExportBridgeSource(module),
    'static-module.h': templates.buildStaticLibraryHeader(module),
    'static-module.cpp': templates.buildStaticLibrarySource(module),
  });
}

async function generatingFromModule<R>(
  generator: OutputGenerator,
  module: W2CGeneratedModule,
  options: ModuleGeneratorOptions,
  targets: string[],
  cb: () => R
): Promise<R | void> {
  return generator.generating<R>([module.sourceModulePath], targets, cb);
}

// public async copyWeakRuntimeHeader() {
//   // const fullOutPath = path.join(libOutputDir, `${name}.c`);
//   // await fs.copyFile(
//   //   pathToRuntimeHeader,
//   //   path.join(libOutputDir, 'wasm-rt.h')
//   // );
// }
