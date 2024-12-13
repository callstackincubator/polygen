import { BinaryReader } from '@callstack/polygen-binary-utils';
import { WebAssemblyDecodeError } from './errors.js';

const decoder = new TextDecoder();

/**
 * Reads a length-encoded sequence of bytes from the binary data.
 */
export function readRawVector(reader: BinaryReader): ArrayBuffer {
  const length = reader.readUnsignedLEB128();
  return reader.readBytes(length);
}

/**
 * Reads a length-encoded UTF-8 string from the binary data.
 *
 * @return The UTF-8 string read from the binary data.
 */
export function readString(reader: BinaryReader): string {
  return decoder.decode(readRawVector(reader));
}

/**
 * Reads a byte from the BinaryReader and looks up its corresponding value in the provided map.
 *
 * @param reader The BinaryReader instance used to read the byte value.
 * @param map A Map object that associates byte values with their corresponding TValue instances.
 * @param debugName A string used for debugging purposes, typically representing the lookup operation.
 * @return The TValue associated with the read byte from the map.
 * @throws WebAssemblyDecodeError if the byte read is not found in the map.
 */
export function readLookup<TValue>(
  reader: BinaryReader,
  map: Map<number, TValue>,
  debugName: string
): TValue {
  const startOffset = reader.currentOffset;
  const byte = reader.readByte();
  const value = map.get(byte);
  if (!value) {
    const expected = [...map.keys()];
    throw new WebAssemblyDecodeError(
      `Could not read '${debugName}', unexpected byte: ${byte.toString(16)}, expected one of [${expected.join(', ')}]`,
      startOffset
    );
  }

  return value;
}

/**
 * Reads a vector of elements from the provided `BinaryReader` using the specified `readFunction`.
 *
 * @param reader - An instance of `BinaryReader` used to read data.
 * @param readFunction - A function that defines how each element is read from the `BinaryReader`.
 * @returns An array of elements of type `TResult` read from the binary source using the provided `readFunction`.
 */
export function readVector<TResult>(
  reader: BinaryReader,
  readFunction: () => TResult
): TResult[] {
  const length = reader.readUnsignedLEB128();
  return Array.from({ length }).map(() => readFunction());
}
