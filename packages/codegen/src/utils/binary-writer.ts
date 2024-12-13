/**
 * Represents the byte order used for reading binary data.
 */
export enum ByteOrder {
  /** Little-endian format: least significant byte is at the smallest address. */
  LittleEndian,

  /** Big-endian format: most significant byte is at the smallest address. */
  BigEndian,
}

/**
 * Represents a utility class for writing binary data sequentially into an `ArrayBuffer`.
 * `BinaryWriter` allows for writing different data types with control over byte order.
 *
 * It also automatically tracks offset in the array buffer. Reading values of specific
 * type moves the offset by the size of the type read.
 */
export class BinaryWriter {
  /**
   * The underlying `ArrayBuffer` instance that contains the binary data.
   */
  public readonly buffer: ArrayBuffer;

  /**
   * The `DataView` instance that provides methods to write data to the `ArrayBuffer`.
   */
  public readonly view: DataView;

  /**
   * The byte order used for writing binary data.
   */
  public readonly byteOrder: ByteOrder;

  /**
   * A boolean value indicating whether the byte order is little-endian.
   */
  public readonly isLittleEndian: boolean;

  private offset: number = 0;

  constructor(byteOrder: ByteOrder, target: ArrayBuffer);
  constructor(byteOrder: ByteOrder, initialSize: number);
  constructor(byteOrder: ByteOrder);
  constructor(byteOrder: ByteOrder, target?: ArrayBuffer | number) {
    if (target instanceof ArrayBuffer) {
      this.buffer = target;
    } else {
      this.buffer = new ArrayBuffer(target ?? 256);
    }
    this.view = new DataView(this.buffer);
    this.byteOrder = byteOrder;
    this.isLittleEndian = byteOrder === ByteOrder.LittleEndian;
  }

  /**
   * A boolean value indicating whether the writer has reached the end of the binary data.
   */
  get isFull(): boolean {
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
   * Writes a signed 8-bit integer to the buffer at the current offset.
   *
   * @param n - The signed 8-bit integer to write.
   * @return The `BinaryWriter` instance, allowing for method chaining.
   */
  writeInt8(n: number): this {
    this.view.setInt8(this.offset, n);
    this.offset += 1;
    return this;
  }

  /**
   * Writes a signed 16-bit integer to the buffer at the current offset.
   *
   * @param n The 16-bit integer value to be written.
   * @return Returns the current instance for method chaining.
   */
  writeInt16(n: number): this {
    this.view.setInt16(this.offset, n, this.isLittleEndian);
    this.offset += 2;
    return this;
  }

  /**
   * Writes a signed 32-bit integer to the buffer at the current offset.
   *
   * @param n The 32-bit signed integer to write.
   * @return The current instance for method chaining.
   */
  writeInt32(n: number): this {
    this.view.setInt32(this.offset, n, this.isLittleEndian);
    this.offset += 4;
    return this;
  }

  /**
   * Writes a signed 64-bit integer to the buffer at the current offset.
   *
   * @param n The 64-bit signed integer to write, represented as a bigint.
   * @return The current instance of the class for method chaining.
   */
  writeInt64(n: bigint): this {
    this.view.setBigInt64(this.offset, n, this.isLittleEndian);
    this.offset += 8;
    return this;
  }

  /**
   * Writes an unsigned 8-bit integer to the buffer at the current offset.
   *
   * @param n The unsigned 8-bit integer value to write.
   * @return Returns the current instance of the class for method chaining.
   */
  writeUint8(n: number): this {
    this.view.setUint8(this.offset, n);
    this.offset += 1;
    return this;
  }

  /**
   * Alias for the `writeUint8` method.
   */
  writeByte = this.writeUint8;

  /**
   * Writes an unsigned 16-bit integer to the buffer at the current offset.
   *
   * @param n The 16-bit unsigned integer value to be written to the buffer.
   * @return Returns the current instance to allow for method chaining.
   */
  writeUint16(n: number): this {
    this.view.setUint16(this.offset, n, this.isLittleEndian);
    this.offset += 2;
    return this;
  }

  /**
   * Writes an unsigned 32-bit integer to the buffer at the current offset.
   *
   * @param n - The 32-bit unsigned integer to write.
   * @return Returns the current instance to allow method chaining.
   */
  writeUint32(n: number): this {
    this.view.setUint32(this.offset, n, this.isLittleEndian);
    this.offset += 4;
    return this;
  }

  /**
   * Writes an unsigned 64-bit integer to the buffer at the current offset.
   *
   * @param n - The 64-bit unsigned integer to write, represented as a bigint.
   * @return The current instance to allow method chaining.
   */
  writeUint64(n: bigint): this {
    this.view.setBigUint64(this.offset, n, this.isLittleEndian);
    this.offset += 8;
    return this;
  }

  /**
   * Writes a 32-bit floating point number to the buffer at the current offset.
   *
   * @param n - The 32-bit floating point number to write.
   * @return The current instance to allow method chaining.
   */
  writeFloat32(n: number): this {
    this.view.setFloat32(this.offset, n, this.isLittleEndian);
    this.offset += 4;
    return this;
  }

  /**
   * Writes a 64-bit floating point number to the buffer at the current offset.
   *
   * @param n - The 64-bit floating point number to write.
   * @return The current instance to allow method chaining.
   */
  writeFloat64(n: number): this {
    this.view.setFloat64(this.offset, n, this.isLittleEndian);
    this.offset += 8;
    return this;
  }

  /**
   * Copies the bytes from the specified buffer into the current buffer starting at the current offset.
   *
   * @param buffer - The source buffer containing the bytes to be copied. It can either be an ArrayLike of numbers or an ArrayBufferLike object.
   * @return void
   */
  copyBytes(buffer: ArrayLike<number> | ArrayBuffer) {
    const bufferArray = new Uint8Array(this.buffer);
    const dataBuffer = new Uint8Array(buffer);
    bufferArray.set(dataBuffer, this.offset);
    this.offset += dataBuffer.byteLength;
  }

  /**
   * Retrieves a portion of the internal buffer that contains written data.
   *
   * @returns An `ArrayBuffer` containing the written data from the start of the buffer up to the current offset.
   */
  getWrittenBuffer(): ArrayBuffer {
    return this.buffer.slice(0, this.offset);
  }

  /**
   * Retrieves the written bytes as a Uint8Array.
   *
   * @return A Uint8Array containing the written bytes.
   */
  getWrittenBytes(): Uint8Array {
    return new Uint8Array(this.getWrittenBuffer());
  }
}
