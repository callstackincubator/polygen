import { Project } from '@callstack/polygen-core-build';
import path from 'path';
import fs from 'node:fs/promises';
import { computeFileChecksumBuffer } from './utils/checksum.js';

const MAGIC_NUMBER = new TextEncoder().encode('CKWASM');
const ALIGNED_MAGIC_NUMBER = new Uint8Array(8).fill(0);
ALIGNED_MAGIC_NUMBER.set(MAGIC_NUMBER);

async function buildModuleSource(pathToModule: string): Promise<string> {
  const cleanName = path.basename(pathToModule, '.wasm');
  const checksum = await computeFileChecksumBuffer(pathToModule);

  const rawName = new TextEncoder().encode(cleanName);
  const stat = await fs.stat(pathToModule);

  const result = concatBuffers(
    ALIGNED_MAGIC_NUMBER.buffer,
    // @ts-ignore
    new Uint8Array(BigUint64Array.of(BigInt(stat.size)).buffer),
    checksum,
    rawName,
    Uint8Array.of(0)
  );

  return (
    `const data = Uint8Array.from(${JSON.stringify([...result])});\n` +
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

function concatBuffers(...buffers: ArrayBuffer[]): Uint8Array {
  const finalSize = buffers.reduce((acc, curr) => acc + curr.byteLength, 0);
  const result = new Uint8Array(finalSize);

  let offset = 0;
  buffers.forEach((buffer) => {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  });

  return result;
}
