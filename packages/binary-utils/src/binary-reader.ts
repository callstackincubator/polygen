import { ByteOrder } from './common.js';

/**
 * The `BinaryReader` class provides methods to read binary data from an `ArrayBuffer`.
 * It handles different data types and supports both little and big endian byte orders.
 *
 * It also automatically tracks offset in the array buffer. Reading values of specific
 * type moves the offset by the size of the type read.
 */
export class BinaryReader {
  /**
   * The underlying `ArrayBuffer` instance that contains the binary data.
   */
  public readonly buffer: ArrayBuffer;

  /**
   * The `DataView` instance that provides methods to read data from the `ArrayBuffer`.
   */
  public readonly view: DataView;

  /**
   * The byte order used for reading binary data.
   */
  public readonly byteOrder: ByteOrder;

  /**
   * A boolean value indicating whether the byte order is little-endian.
   */
  public readonly isLittleEndian: boolean;

  private offset: number = 0;

  constructor(buffer: ArrayBuffer, byteOrder: ByteOrder) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.byteOrder = byteOrder;
    this.isLittleEndian = byteOrder === ByteOrder.LittleEndian;
  }

  /**
   * A boolean value indicating whether the reader has reached the end of the binary data.
   */
  get isEmpty(): boolean {
    return this.offset + 1 >= this.view.byteLength;
  }

  /**
   * The current offset in the binary data.
   */
  get currentOffset(): number {
    return this.offset;
  }

  /**
   * Moves the internal offset forward by the specified number.
   *
   * @param n - The number of positions to move the offset forward.
   * @return The new position of the internal offset after being moved.
   */
  skip(n: number) {
    this.offset += n;
  }

  /**
   * Skips the binary data until the specified byte value is found.
   */
  skipUntilByte(value: number) {
    while (this.view.getUint8(this.offset) !== value) {
      this.offset += 1;
    }
    this.offset += 1;
  }

  /**
   * Reads a signed 8-bit integer from the binary data.
   *
   * @return The signed 8-bit integer read from the binary
   */
  readInt8() {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /**
   * Reads a signed 16-bit integer from the binary data.
   *
   * @return The signed 16-bit integer read from the binary
   */
  readInt16(): number {
    const value = this.view.getInt16(this.offset, this.isLittleEndian);
    this.offset += 2;
    return value;
  }

  /**
   * Reads a signed 32-bit integer from the binary data.
   *
   * @return The signed 32-bit integer read from the binary
   */
  readInt32(): number {
    const value = this.view.getInt32(this.offset, this.isLittleEndian);
    this.offset += 4;
    return value;
  }

  /**
   * Reads a signed 64-bit integer from the binary data.
   *
   * @return The signed 64-bit integer read from the binary
   */
  readInt64(): bigint {
    const value = this.view.getBigInt64(this.offset, this.isLittleEndian);
    this.offset += 8;
    return value;
  }

  /**
   * Reads an unsigned 8-bit integer from the binary data.
   *
   * @return The unsigned 8-bit integer read from the binary
   */
  readUint8(): number {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  /**
   * Reads a signed 32-bit integer from the binary data.
   */
  readByte = this.readUint8;

  /**
   * Reads an unsigned 16-bit integer from the binary data.
   *
   * @return The unsigned 16-bit integer read from the binary
   */
  readUint16(): number {
    const value = this.view.getUint16(this.offset, this.isLittleEndian);
    this.offset += 2;
    return value;
  }

  /**
   * Reads an unsigned 32-bit integer from the binary data.
   *
   * @return The unsigned 32-bit integer read from the binary
   */
  readUint32(): number {
    const value = this.view.getUint32(this.offset, this.isLittleEndian);
    this.offset += 4;
    return value;
  }

  /**
   * Reads an unsigned 64-bit integer from the binary data.
   *
   * @return The unsigned 64-bit integer read from the binary
   */
  readUint64(): bigint {
    const value = this.view.getBigUint64(this.offset, this.isLittleEndian);
    this.offset += 8;
    return value;
  }

  /**
   * Reads a 32-bit floating point number from the binary data.
   *
   * @return The 32-bit floating point number read from the binary
   */
  readFloat32(): number {
    const value = this.view.getFloat32(this.offset, this.isLittleEndian);
    this.offset += 4;
    return value;
  }

  /**
   * Reads a 64-bit floating point number from the binary data.
   *
   * @return The 64-bit floating point number read from the binary
   */
  readFloat64(): number {
    const value = this.view.getFloat64(this.offset, this.isLittleEndian);
    this.offset += 8;
    return value;
  }

  /**
   * Reads a sequence of bytes from the binary data.
   *
   * @param n - The number of bytes to read from the binary data.
   * @return The sequence of bytes read from the binary data.
   */
  readBytes(n: number): ArrayBuffer {
    const value = this.buffer.slice(this.offset, this.offset + n);
    this.offset += n;
    return value;
  }

  /**
   * Reads an unsigned LEB128 (Little-Endian Base 128) encoded integer from the current data stream.
   *
   * The method successively reads bytes and assembles the result until it detects the last byte
   * of the sequence, which can be identified when the high-order bit is not set.
   *
   * @return The unsigned integer decoded from the LEB128 format.
   */
  readUnsignedLEB128(): number {
    let result = 0;
    let shift = 0;
    while (true) {
      const byte = this.readUint8();
      // eslint-disable-next-line no-bitwise
      result |= (byte & 0x7f) << shift;
      // eslint-disable-next-line no-bitwise
      if ((byte & 0x80) === 0) {
        break;
      }

      shift += 7;
    }

    return result;
  }

  /**
   * Reads a signed LEB128 (Little Endian Base 128) encoded integer from the current position in a data stream.
   * The method processes the bytes of the input, extracting and reconstructing the integer value using bitwise operations.
   *
   * @return The decoded signed integer value from the LEB128 encoded input.
   */
  readSignedLEB128(): number {
    let result = 0;
    let shift = 0;
    while (true) {
      const byte = this.readUint8();
      // eslint-disable-next-line no-bitwise
      result |= (byte & 0x7f) << shift;
      shift += 7;

      // eslint-disable-next-line no-bitwise
      if ((byte & 0x80) === 0) {
        // eslint-disable-next-line no-bitwise
        if (shift < 32 && (byte & 0x40) !== 0) {
          // eslint-disable-next-line no-bitwise
          return result | (~0 << shift);
        }
        break;
      }
    }

    return result;
  }
}
