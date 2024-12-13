/**
 * A union type representing all the TypedArray types available in JavaScript.
 *
 * TypedArrays are array-like views of binary data. Each type in this union represents
 * a different way of interpreting and manipulating binary data in memory.
 *
 * - Int8Array: 8-bit two's complement signed integer
 * - Uint8Array: 8-bit unsigned integer
 * - Uint8ClampedArray: 8-bit unsigned integer clamped to 0-255
 * - Int16Array: 16-bit two's complement signed integer
 * - Uint16Array: 16-bit unsigned integer
 * - Int32Array: 32-bit two's complement signed integer
 * - Uint32Array: 32-bit unsigned integer
 * - Float32Array: 32-bit IEEE floating point number
 * - Float64Array: 64-bit IEEE floating point number
 * - BigInt64Array: 64-bit signed integer
 * - BigUint64Array: 64-bit unsigned integer
 *
 * Use this type when a variable or parameter can be any typed array.
 */
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

/**
 * Compares two ArrayBuffers for equality, determining if they contain the same sequence of bytes.
 *
 * @param a - The first ArrayBuffer to compare.
 * @param b - The second ArrayBuffer to compare.
 * @return A boolean value indicating whether the two ArrayBuffers are equal.
 */
export function arrayBuffersEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  return dataViewsAreEqual(new DataView(a), new DataView(b));
}

/**
 * Compares two DataView instances to determine if they are equal in content and length.
 *
 * @param a - The first DataView instance to compare.
 * @param b - The second DataView instance to compare.
 * @return A boolean indicating whether the two DataView instances are equal.
 */
export function dataViewsAreEqual(a: DataView, b: DataView): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }

  for (let i = 0; i < a.byteLength; ++i) {
    if (a.getUint8(i) !== b.getUint8(i)) {
      return false;
    }
  }

  return true;
}

/**
 * Compares two typed arrays for equality by checking if they have the same byte length
 * and identical data.
 *
 * @param a - The first typed array to compare.
 * @param b - The second typed array to compare.
 * @return A boolean indicating whether the two typed arrays are equal.
 */
export function typedArraysAreEqual<T extends TypedArray>(a: T, b: T): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }

  return dataViewsAreEqual(new DataView(a.buffer), new DataView(b.buffer));
}
