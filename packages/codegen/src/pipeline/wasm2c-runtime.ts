import type { HostProjectGeneratedContext, Plugin } from '../plugin.js';

/**
 * Plugin that generates a virtual module for Metro support.
 */
export function embedWasmRuntime(): Plugin {
  return {
    name: 'core/wasm2c-runtime',
    title: 'WebAssembly runtime embedding',

    async hostProjectGenerated({ projectOutput }): Promise<void> {
      await projectOutput.copyAsset('wasm-rt');
    },
  };
}
