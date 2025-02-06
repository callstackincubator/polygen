import { W2CModuleContext } from '../context/index.js';
import { OutputGenerator } from '../helpers/output-generator.js';
import * as templates from '../templates/host.js';

/**
 * Generates the host module bridge by creating necessary files
 * and copying required assets for the host module.
 *
 * @param generator - The output generator used for file and asset operations.
 * @param modules - An array of WebAssembly-to-C host module contexts to be processed.
 * @return A promise that resolves once all files and assets have been processed.
 */
export async function generateHostModuleBridge(
  generator: OutputGenerator,
  modules: W2CModuleContext[]
) {
  await Promise.all([
    generator.copyAsset('wasm-rt'),
    generator.writeAllTo({
      'loader.cpp': templates.buildHostSource(modules),
      'ReactNativeWebAssemblyHost.podspec': templates.buildPodspec(),
    }),
  ]);
}
