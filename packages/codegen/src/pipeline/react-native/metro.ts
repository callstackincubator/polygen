import path from 'path';
import { BinaryWriter, ByteOrder } from '@callstack/polygen-binary-utils';
import { computeFileChecksumBuffer } from '../../helpers/checksum.js';
import type { Plugin } from '../../plugin.js';

const MAGIC_NUMBER = new TextEncoder().encode('CKWASM');

/**
 * Plugin that generates a virtual module for Metro support.
 */
export function metroResolver(): Plugin {
  return {
    name: 'core/metro-resolver',

    /**
     * Generates a JavaScript module file for a given WebAssembly (.wasm) module.
     * The generated module will be placed under the project's output directory.
     *
     * @param module - The WebAssembly (.wasm) module that needs to be processed.
     * @param resolvedPath - The resolved path to the WebAssembly module file.
     * @return A promise that resolves when the JavaScript module file is successfully created.
     */
    async moduleGenerated({ output, module }): Promise<void> {
      const cleanFileName = path.basename(module.path, '.wasm');
      const dirnameInModule = path.dirname(module.path);
      const generatedModulePath = path.join(
        module.kind === 'external' ? `${module.packageName}` : '#local',
        dirnameInModule,
        `${cleanFileName}.js`
      );
      const source = await buildMetroVirtualModuleSourceFor(
        module.resolvedPath
      );

      const generator = output.forPath('modules');
      await generator.writeTo(generatedModulePath, source);
    },
  };
}

/**
 * Generates source for virtual webassembly module
 * @param pathToModule
 */
async function buildMetroVirtualModuleSourceFor(
  pathToModule: string
): Promise<string> {
  const cleanName = path.basename(pathToModule, '.wasm');
  const checksumRaw = await computeFileChecksumBuffer(pathToModule);
  const checksumHex = new TextEncoder().encode(checksumRaw.toString('hex'));

  const rawName = new TextEncoder().encode(cleanName);
  const writer = new BinaryWriter(ByteOrder.LittleEndian);
  writer.copyBytes(MAGIC_NUMBER.buffer as ArrayBuffer);
  writer.writeUint8(1);
  writer.copyBytes(checksumHex.buffer as ArrayBuffer);
  writer.writeUint8(0);
  writer.writeUint16(rawName.length);
  writer.copyBytes(rawName.buffer as ArrayBuffer);
  // null terminator just in case
  writer.writeUint8(0);

  return (
    `const data = Uint8Array.from(${JSON.stringify([...writer.getWrittenBytes()])});\n` +
    `export default data.buffer;`
  );
}
