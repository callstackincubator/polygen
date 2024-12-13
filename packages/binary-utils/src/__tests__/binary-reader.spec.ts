import { describe, expect, it } from 'vitest';
import { BinaryReader } from '../binary-reader.js';
import { ByteOrder } from '../common.js';

describe('BinaryReader', () => {
  it('should initialize with given buffer and byte order', () => {
    const buffer = new ArrayBuffer(8);
    const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

    expect(reader.buffer).toBe(buffer);
    expect(reader.byteOrder).toBe(ByteOrder.LittleEndian);
  });

  it('should return false for isEmpty when not at the end', () => {
    const buffer = new ArrayBuffer(8);
    const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

    expect(reader.isEmpty).toBe(false);
  });

  it('should return true for isEmpty when at the end', () => {
    const buffer = new ArrayBuffer(1);
    const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);
    reader.readUint8();

    expect(reader.isEmpty).toBe(true);
  });

  it('should return initial offset as 0', () => {
    const buffer = new ArrayBuffer(8);
    const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

    expect(reader.currentOffset).toBe(0);
  });

  it('should skip given number of bytes', () => {
    const buffer = new ArrayBuffer(8);
    const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);
    reader.skip(4);

    expect(reader.currentOffset).toBe(4);
  });

  it('should skip until specified byte value is found', () => {
    const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
    const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);
    reader.skipUntilByte(3);

    expect(reader.currentOffset).toBe(3);
    expect(reader.readByte()).toBe(4);
  });

  it('should read a sequence of bytes', () => {
    const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
    const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

    expect(reader.readBytes(2)).toEqual(new Uint8Array([1, 2]).buffer);
  });

  describe('littleEndian', () => {
    it('should read a signed 8-bit integer', () => {
      const buffer = new Int8Array([-1]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

      expect(reader.readInt8()).toBe(-1);
    });

    it('should read a signed 16-bit integer', () => {
      const buffer = new Uint8Array([0xfe, 0xff]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

      expect(reader.readInt16()).toBe(-2);
    });

    it('should read a signed 32-bit integer', () => {
      const buffer = new Uint8Array([0xfe, 0xff, 0xff, 0xff]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

      expect(reader.readInt32()).toBe(-2);
    });

    it('should read a signed 64-bit integer', () => {
      const buffer = new Uint8Array([
        0xfe, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      ]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

      expect(reader.readInt64()).toBe(-2n);
    });

    it('should read an unsigned 8-bit integer', () => {
      const buffer = new Uint8Array([255]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

      expect(reader.readUint8()).toBe(255);
    });

    it('should read an unsigned 16-bit integer', () => {
      const buffer = new Uint8Array([1, 0]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

      expect(reader.readUint16()).toBe(1);
    });

    it('should read an unsigned 32-bit integer', () => {
      const buffer = new Uint8Array([1, 0, 0, 0]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

      expect(reader.readUint32()).toBe(1);
    });

    it('should read an unsigned 64-bit integer', () => {
      const buffer = new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

      expect(reader.readUint64()).toBe(1n);
    });

    it('should read a 32-bit float', () => {
      const buffer = new Uint8Array([0xa4, 0x70, 0x9d, 0x3f]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

      expect(reader.readFloat32()).toBeCloseTo(1.23, 2);
    });

    it('should read a 64-bit float', () => {
      const buffer = new Uint8Array([
        0xae, 0x47, 0xe1, 0x7a, 0x14, 0xae, 0xf3, 0x3f,
      ]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

      expect(reader.readFloat64()).toBeCloseTo(1.23, 2);
    });

    it('should read an unsigned LEB128 integer', () => {
      const buffer = new Uint8Array([0xe5, 0x8e, 0x26]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

      expect(reader.readUnsignedLEB128()).toBe(624485);
    });

    it('should read a signed LEB128 integer', () => {
      const buffer = new Uint8Array([0x9b, 0xf1, 0x59]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

      expect(reader.readSignedLEB128()).toBe(-624485);
    });
  });

  describe('bigEndian', () => {
    it('should initialize with byte order', () => {
      const buffer = new ArrayBuffer(8);
      const reader = new BinaryReader(buffer, ByteOrder.BigEndian);

      expect(reader.buffer).toBe(buffer);
      expect(reader.byteOrder).toBe(ByteOrder.BigEndian);
    });

    it('should read a signed 8-bit integer', () => {
      const buffer = new Int8Array([-1]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.BigEndian);

      expect(reader.readInt8()).toBe(-1);
    });

    it('should read a signed 16-bit integer', () => {
      const buffer = new Int8Array([0xff, 0xfe]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.BigEndian);

      expect(reader.readInt16()).toBe(-2);
    });

    it('should read a signed 32-bit integer', () => {
      const buffer = new Uint8Array([0xff, 0xff, 0xff, 0xfe]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.BigEndian);

      expect(reader.readInt32()).toBe(-2);
    });

    it('should read a signed 64-bit integer', () => {
      const buffer = new Uint8Array([
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe,
      ]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.BigEndian);

      expect(reader.readInt64()).toBe(-2n);
    });

    it('should read an unsigned 8-bit integer', () => {
      const buffer = new Uint8Array([255]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.BigEndian);

      expect(reader.readUint8()).toBe(255);
    });

    it('should read an unsigned 16-bit integer', () => {
      const buffer = new Uint8Array([0, 1]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.BigEndian);

      expect(reader.readUint16()).toBe(1);
    });

    it('should read an unsigned 32-bit integer', () => {
      const buffer = new Uint8Array([0, 0, 0, 1]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.BigEndian);

      expect(reader.readUint32()).toBe(1);
    });

    it('should read an unsigned 64-bit integer', () => {
      const buffer = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.BigEndian);

      expect(reader.readUint64()).toBe(1n);
    });

    it('should read a 32-bit float', () => {
      const buffer = new Uint8Array([0xa4, 0x70, 0x9d, 0x3f].toReversed())
        .buffer;
      const reader = new BinaryReader(buffer, ByteOrder.BigEndian);

      expect(reader.readFloat32()).toBeCloseTo(1.23, 2);
    });

    it('should read a 64-bit float', () => {
      const buffer = new Uint8Array(
        [0xae, 0x47, 0xe1, 0x7a, 0x14, 0xae, 0xf3, 0x3f].toReversed()
      ).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.BigEndian);

      expect(reader.readFloat64()).toBeCloseTo(1.23, 2);
    });

    it('should read an unsigned LEB128 integer', () => {
      const buffer = new Uint8Array([0xe5, 0x8e, 0x26]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.BigEndian);

      expect(reader.readUnsignedLEB128()).toBe(624485);
    });

    it('should read a signed LEB128 integer', () => {
      const buffer = new Uint8Array([0x9b, 0xf1, 0x59]).buffer;
      const reader = new BinaryReader(buffer, ByteOrder.BigEndian);

      expect(reader.readSignedLEB128()).toBe(-624485);
    });
  });

  it('should not read excessive bytes when reading LEB128 #1', () => {
    const buffer = new Uint8Array([0xe5, 0x8e, 0x26, 0x00, 0x01]).buffer;
    const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

    expect(reader.readUnsignedLEB128()).toBe(624485);
    expect(reader.currentOffset).toBe(3);
  });

  it('should not read excessive bytes when reading LEB128 #2', () => {
    const buffer = new Uint8Array([0x10, 0x1, 0x00]).buffer;
    const reader = new BinaryReader(buffer, ByteOrder.LittleEndian);

    expect(reader.readUnsignedLEB128()).toBe(0x10);
    expect(reader.currentOffset).toBe(1);
  });
});
