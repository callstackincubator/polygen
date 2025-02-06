import type { W2CImportedModule } from '../context/index.js';
import { OutputGenerator } from '../helpers/output-generator.js';
import * as templates from '../templates/library/index.js';

export async function generateImportedModuleBridge(
  generator: OutputGenerator,
  module: W2CImportedModule
) {
  await generator.writeAllTo({
    [`${module.name}-imports.h`]: templates.buildImportBridgeHeader(module),
    [`${module.name}-imports.cpp`]: templates.buildImportBridgeSource(module),
  });
}
