import consola from 'consola';
import type { W2CModuleContext } from '../context/context.js';
import { OutputGenerator } from '../helpers/output-generator.js';
import { generateCSources } from '../wasm2c.js';
import * as templates from '../templates/library/index.js';

export interface ModuleGeneratorOptions {
  renderMetadata?: boolean;
  forceGenerate?: boolean;
  hackAutoNumberCoerce?: boolean;
}

export async function generateModuleExportsBridge(
  generator: OutputGenerator,
  module: W2CModuleContext,
  options: ModuleGeneratorOptions
) {
  try {
    // TODO; remove generated files on dev (or always)
    await Promise.allSettled([
      generateCSource(generator, module, options),
      generateJSIBridge(generator, module, options),
      renderMetadata(generator, module),
    ]);
  } catch (e) {
    consola.error(e);
  }
}

async function generateCSource(
  generator: OutputGenerator,
  module: W2CModuleContext,
  options: ModuleGeneratorOptions
) {
  const outputPath = generator.outputPathTo(module.name);
  const generatedFiles = [`${outputPath}.c`, `${outputPath}.h`];

  return generatingFromModule(
    generator,
    module,
    options,
    generatedFiles,
    async () => {
      await generateCSources(module.sourceModulePath, outputPath);
    }
  );
}

async function generateJSIBridge(
  generator: OutputGenerator,
  module: W2CModuleContext,
  options: ModuleGeneratorOptions
) {
  await generator.writeAllTo({
    'jsi-exports-bridge.h': templates.buildExportBridgeHeader(module),
    'jsi-exports-bridge.cpp': templates.buildExportBridgeSource(module, {
      hackAutoNumberCoerce: options.hackAutoNumberCoerce,
    }),
    'static-module.h': templates.buildStaticLibraryHeader(module),
    'static-module.cpp': templates.buildStaticLibrarySource(module),
  });
}

async function renderMetadata(
  generator: OutputGenerator,
  module: W2CModuleContext
) {
  await generator.writeTo(
    `${module.name}.exports.json`,
    JSON.stringify(module.codegen.exports, null, 2)
  );

  await generator.writeTo(
    `${module.name}.imports.json`,
    JSON.stringify(module.codegen.imports, null, 2)
  );
}

async function generatingFromModule<R>(
  generator: OutputGenerator,
  module: W2CModuleContext,
  options: ModuleGeneratorOptions,
  targets: string[],
  cb: () => R
): Promise<R | void> {
  if (options.forceGenerate) {
    return cb();
  }

  return generator.generating<R>([module.sourceModulePath], targets, cb);
}

// public async copyWeakRuntimeHeader() {
//   // const fullOutPath = path.join(libOutputDir, `${name}.c`);
//   // await fs.copyFile(
//   //   pathToRuntimeHeader,
//   //   path.join(libOutputDir, 'wasm-rt.h')
//   // );
// }
