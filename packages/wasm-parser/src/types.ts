import type { RefType, ResultType, ValueType } from './reader/types.js';

/**
 * Represents a function in a WebAssembly module.
 */
export interface ModuleFunction {
  kind: 'function';
  parametersTypes: ResultType;
  resultTypes: ResultType;
}

/**
 * Represents a global variable in a WebAssembly module.
 */
export interface ModuleGlobal {
  kind: 'global';
  type: ValueType;
  isMutable: boolean;
}

/**
 * Represents a memory section in a WebAssembly module.
 */
export interface ModuleMemory {
  kind: 'memory';
  minSize: number;
  maxSize?: number;
}

/**
 * Represents a table section in a WebAssembly module.
 */
export interface ModuleTable {
  kind: 'table';
  elementType: RefType;
  minSize: number;
  maxSize?: number;
}

/**
 * Union type representing any symbol in a WebAssembly module.
 */
export type ModuleSymbol =
  | ModuleFunction
  | ModuleGlobal
  | ModuleMemory
  | ModuleTable;

/**
 * Represents an import in a WebAssembly module.
 */
export interface ModuleImport<T = ModuleSymbol> {
  kind: 'import';
  module: string;
  name: string;
  target: T;
}

/**
 * Represents an export in a WebAssembly module.
 */
export interface ModuleExport<T = ModuleSymbol> {
  kind: 'export';
  name: string;
  target: T;
}
