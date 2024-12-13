import type {
  FunctionType,
  GlobalType,
  Limits,
  MemoryType,
  NumberType,
  RefType,
  ResultType,
  TableType,
  ValueType,
  VectorType,
} from './types.js';
import { BinaryReader } from '@callstack/polygen-binary-utils';
import { readLookup, readVector } from './utils.js';
import { WebAssemblyDecodeError } from './errors.js';

/**
 * A mapping of binary encoding of a type to its respective type name.
 */
const NUMBER_TYPE_ENC: Map<number, NumberType> = new Map([
  [0x7f, 'i32'],
  [0x7e, 'i64'],
  [0x7d, 'f32'],
  [0x7c, 'f64'],
]);

/**
 * A mapping of binary encoding of a type to its respective type name.
 */
const VEC_TYPE_ENC: Map<number, VectorType> = new Map([[0x7b, 'v128']]);

/**
 * A mapping of binary encoding of a type to its respective type name.
 */
const REF_TYPE_ENC: Map<number, RefType> = new Map([
  [0x70, 'funcref'],
  [0x6f, 'externref'],
]);

/**
 * A mapping of binary encoding of a type to its respective type name.
 */
const VAL_TYPE_ENC: Map<number, ValueType> = new Map([
  ...NUMBER_TYPE_ENC,
  ...VEC_TYPE_ENC,
  ...REF_TYPE_ENC,
]);

const FUNC_BYTE = 0x60;
const OPEN_LIMIT_BYTE = 0x00;
const CLOSED_LIMIT_BYTE = 0x01;
const VAR_MUTABLE_BYTE = 0x00;
const VAR_IMMUTABLE_BYTE = 0x01;

export function readNumType(reader: BinaryReader): NumberType {
  return readLookup(reader, NUMBER_TYPE_ENC, 'numtype');
}

export function readVecType(reader: BinaryReader): VectorType {
  return readLookup(reader, VEC_TYPE_ENC, 'vectype');
}

export function readRefType(reader: BinaryReader): RefType {
  return readLookup(reader, REF_TYPE_ENC, 'reftype');
}

export function readValType(reader: BinaryReader): ValueType {
  return readLookup(reader, VAL_TYPE_ENC, 'valtype');
}

export function readResultType(reader: BinaryReader): ResultType {
  return readVector(reader, () => readValType(reader));
}

export function readFunctionType(reader: BinaryReader): FunctionType {
  const startOffset = reader.currentOffset;
  const byte = reader.readByte();
  if (byte !== FUNC_BYTE) {
    throw new WebAssemblyDecodeError(
      `Could not read 'functype', unexpected byte: ${byte.toString(16)}, expected '${FUNC_BYTE}'`,
      startOffset
    );
  }

  const parameterTypes = readResultType(reader);
  const returnTypes = readResultType(reader);
  return { parameterTypes, returnTypes };
}

export function readLimits(reader: BinaryReader): Limits {
  const startOffset = reader.currentOffset;
  const byte = reader.readByte();
  if (byte === OPEN_LIMIT_BYTE) {
    const min = reader.readUnsignedLEB128();
    return { min };
  } else if (byte === CLOSED_LIMIT_BYTE) {
    const min = reader.readUnsignedLEB128();
    const max = reader.readUnsignedLEB128();
    return { min, max };
  } else {
    throw new WebAssemblyDecodeError(
      `Could not read 'limits', unexpected byte: ${byte.toString(16)}, expected '${OPEN_LIMIT_BYTE}' or '${CLOSED_LIMIT_BYTE}'`,
      startOffset
    );
  }
}

export function readMemoryType(reader: BinaryReader): MemoryType {
  return readLimits(reader);
}

export function readTableType(reader: BinaryReader): TableType {
  const elementType = readRefType(reader);
  const limits = readLimits(reader);
  return { elementType, limits };
}

export function readGlobalType(reader: BinaryReader): GlobalType {
  const valueType = readValType(reader);
  const startOffset = reader.currentOffset;
  const byte = reader.readByte();
  if (byte !== VAR_MUTABLE_BYTE && byte !== VAR_IMMUTABLE_BYTE) {
    throw new WebAssemblyDecodeError(
      `Could not read 'mut', unexpected byte: ${byte.toString(16)}, expected one of [${VAR_MUTABLE_BYTE.toString(16)}, ${VAR_IMMUTABLE_BYTE.toString(16)}]}]`,
      startOffset
    );
  }
  const isMutable = byte === VAR_MUTABLE_BYTE;
  return { valueType, isMutable };
}
