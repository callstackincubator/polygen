import { Project } from '@callstack/polygen-core-build';
import path from 'path';
import fs from 'node:fs/promises';
import { computeFileChecksumBuffer } from './utils/checksum.js';
import { BinaryWriter, ByteOrder } from './utils/binary-writer.js';

const MAGIC_NUMBER = new TextEncoder().encode('CKWASM');

async function buildModuleSource(pathToModule: string): Promise<string> {
  const cleanName = path.basename(pathToModule, '.wasm');
  const checksum = await computeFileChecksumBuffer(pathToModule);

  const rawName = new TextEncoder().encode(cleanName);
  const stat = await fs.stat(pathToModule);
  const writer = new BinaryWriter(ByteOrder.LittleEndian);
  writer.copyBytes(MAGIC_NUMBER.buffer);
  writer.writeUint8(1);
  writer.writeUint64(BigInt(stat.size));
  writer.copyBytes(checksum.buffer);
  writer.writeUint16(rawName.length);
  writer.copyBytes(rawName.buffer);
  // null terminator just in case
  writer.writeUint8(0);

  return (
    `const data = Uint8Array.from(${JSON.stringify([...writer.getWrittenBytes()])});\n` +
    `export default data.buffer;`
  );
}

export async function generateWasmJSModule(
  project: Project,
  pathToModule: string
) {
  const cleanName = path.basename(pathToModule, '.wasm');
  const pathInModule = project.globalPathToLocal(
    project.pathTo(pathToModule),
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
  const source = await buildModuleSource(pathToModule);
  await fs.writeFile(generatedModulePath, source, 'utf8');
}
