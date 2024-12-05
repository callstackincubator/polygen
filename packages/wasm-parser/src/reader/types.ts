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

export interface DescriptorValue<T extends string> {
  type: T;
  index: number;
}

export type Descriptor =
  | DescriptorValue<'function'>
  | DescriptorValue<'table'>
  | DescriptorValue<'memory'>
  | DescriptorValue<'global'>;

export interface Import {
  module: string;
  name: string;
  descriptor: Descriptor;
}

export interface ImportSection {
  type: 'import';
  imports: Import[];
}

export interface FunctionSection {
  type: 'function';
  indicies: number[];
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

export interface Export {
  name: string;
  descriptor: Descriptor;
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
