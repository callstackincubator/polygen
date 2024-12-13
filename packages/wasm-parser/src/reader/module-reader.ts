import {
  BinaryReader,
  ByteOrder,
  arrayBuffersEqual,
} from '@callstack/polygen-binary-utils';
import { WebAssemblyDecodeError } from './errors.js';
import { readSections } from './section-reader.js';

const MAGIC = Uint8Array.of(0x00, 0x61, 0x73, 0x6d).buffer;

/**
 * Reads and verifies the magic number from the binary data to ensure it represents a valid
 * WebAssembly module.
 *
 * @param reader - An instance of BinaryReader that provides methods to read bytes from binary data.
 * @returns Throws a WebAssemblyDecodeError if the magic number does not match the expected value.
 */
export function readMagic(reader: BinaryReader) {
  const startOffset = reader.currentOffset;
  const magic = reader.readBytes(4);
  if (!arrayBuffersEqual(MAGIC, magic)) {
    throw new WebAssemblyDecodeError(
      'Specified module is not a valid binary WebAssembly module',
      startOffset
    );
  }
}

/**
 * Reads and returns a 32-bit unsigned integer representing the version
 * from the provided BinaryReader instance.
 *
 * @param reader The BinaryReader instance from which the version is read.
 * @return The version as a 32-bit unsigned integer.
 */
export function readVersion(reader: BinaryReader): number {
  return reader.readUint32();
}

/**
 * Reads a raw WebAssembly module from the provided ArrayBuffer.
 *
 * This function utilizes a generator to iterate over the sections of the module.
 *
 * @param data - The ArrayBuffer containing the binary representation of the WebAssembly module.
 * @return A generator that yields sections of the WebAssembly module.
 */
export function* readModuleRaw(data: ArrayBuffer) {
  const reader = new BinaryReader(data, ByteOrder.LittleEndian);
  readMagic(reader);
  const version = readVersion(reader);
  const startOffset = reader.currentOffset;
  if (version !== 1) {
    throw new WebAssemblyDecodeError(
      `Unsupported WebAssembly version '${version}'`,
      startOffset
    );
  }

  yield* readSections(reader);
}
