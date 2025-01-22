export type NumberType = 'i32' | 'i64' | 'f32' | 'f64';
export type VectorType = 'v128';
export type RefType = 'funcref' | 'externref';

export type ValueType = NumberType | VectorType | RefType;

export type ResultType = ValueType[];

export interface FunctionType {
  parameterTypes: ValueType[];
  returnTypes: ValueType[];
}

export interface Limits {
  min: number;
  max?: number;
}

export type MemoryType = Limits;

export interface TableType {
  elementType: RefType;
  limits: Limits;
}

export interface GlobalType {
  valueType: ValueType;
  isMutable: boolean;
}

export interface CustomSection {
  type: 'custom';
  name: string;
  data: ArrayBuffer;
}

export interface TypeSection {
  type: 'type';
  types: FunctionType[];
}

export type ImportDescriptor =
  | { type: 'function'; index: number }
  | { type: 'table'; table: TableType }
  | { type: 'memory'; memory: MemoryType }
  | { type: 'global'; global: GlobalType };

export interface Import {
  module: string;
  name: string;
  descriptor: ImportDescriptor;
}

export interface ImportSection {
  type: 'import';
  imports: Import[];
}

export interface FunctionSection {
  type: 'function';
  indices: number[];
}

export interface TableSection {
  type: 'table';
  tables: TableType[];
}

export interface MemorySection {
  type: 'memory';
  memories: MemoryType[];
}

export interface Global {
  type: GlobalType;
}

export interface GlobalSection {
  type: 'global';
  globals: Global[];
}

export type ExportDescriptor =
  | { type: 'function'; index: number }
  | { type: 'table'; index: number }
  | { type: 'memory'; index: number }
  | { type: 'global'; index: number };

export interface Export {
  name: string;
  descriptor: ExportDescriptor;
}

export interface ExportSection {
  type: 'export';
  exports: Export[];
}

export type Section =
  | CustomSection
  | TypeSection
  | ImportSection
  | FunctionSection
  | TableSection
  | MemorySection
  | GlobalSection
  | ExportSection;
