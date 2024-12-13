import fs from 'node:fs/promises';
import path from 'path';
import { BinaryWriter, ByteOrder } from '@callstack/polygen-binary-utils';
import { computeFileChecksumBuffer } from '../helpers/checksum.js';

const MAGIC_NUMBER = new TextEncoder().encode('CKWASM');

export async function generateWasmJSModuleSource(
  pathToModule: string
): Promise<string> {
  const cleanName = path.basename(pathToModule, '.wasm');
  const checksum = await computeFileChecksumBuffer(pathToModule);

  const rawName = new TextEncoder().encode(cleanName);
  const stat = await fs.stat(pathToModule);
  const writer = new BinaryWriter(ByteOrder.LittleEndian);
  writer.copyBytes(MAGIC_NUMBER.buffer as ArrayBuffer);
  writer.writeUint8(1);
  writer.writeUint64(BigInt(stat.size));
  writer.copyBytes(checksum.buffer as ArrayBuffer);
  writer.writeUint16(rawName.length);
  writer.copyBytes(rawName.buffer as ArrayBuffer);
  // null terminator just in case
  writer.writeUint8(0);

  return (
    `const data = Uint8Array.from(${JSON.stringify([...writer.getWrittenBytes()])});\n` +
    `export default data.buffer;`
  );
}
