import type { W2CExternModule } from '../codegen/modules.js';
import type { OutputGenerator } from '../helpers/output-generator.js';
import * as templates from '../templates/library/index.js';

export async function generateImportedModuleBridge(
  generator: OutputGenerator,
  module: W2CExternModule
) {
  await generator.writeAllTo({
    [`${module.name}-imports.h`]: templates.buildImportBridgeHeader(module),
    [`${module.name}-imports.cpp`]: templates.buildImportBridgeSource(module),
  });
}
