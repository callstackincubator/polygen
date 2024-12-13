import { describe, expect, it } from 'vitest';
import { arrayBuffersEqual } from '../helpers.js';

describe('arrayBuffersEqual', () => {
  it('should return true for equal buffers', () => {
    const bufferA = new ArrayBuffer(8);
    const bufferB = new ArrayBuffer(8);

    const viewA = new DataView(bufferA);
    const viewB = new DataView(bufferB);
    for (let i = 0; i < 8; i++) {
      viewA.setUint8(i, i);
      viewB.setUint8(i, i);
    }

    expect(arrayBuffersEqual(bufferA, bufferB)).toBe(true);
  });

  it('should return false for buffers with different lengths', () => {
    const bufferA = new ArrayBuffer(8);
    const bufferB = new ArrayBuffer(9);
    expect(arrayBuffersEqual(bufferA, bufferB)).toBe(false);
  });

  it('should return false for buffers with same length but different content', () => {
    const bufferA = new ArrayBuffer(8);
    const bufferB = new ArrayBuffer(8);

    const viewA = new DataView(bufferA);
    const viewB = new DataView(bufferB);
    for (let i = 0; i < 8; i++) {
      viewA.setUint8(i, i);
      viewB.setUint8(i, i + 1);
    }

    expect(arrayBuffersEqual(bufferA, bufferB)).toBe(false);
  });

  it('should return true for both empty buffers', () => {
    const bufferA = new ArrayBuffer(0);
    const bufferB = new ArrayBuffer(0);
    expect(arrayBuffersEqual(bufferA, bufferB)).toBe(true);
  });
});
