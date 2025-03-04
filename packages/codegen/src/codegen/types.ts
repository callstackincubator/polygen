import type {
  ModuleGlobal,
  ModuleMemory,
  ModuleTable,
  ResultType,
} from '@callstack/wasm-parser';
import type { W2CModuleBase } from './modules.js';

/**
 * Information about an exported WASM symbol generated by wasm2c.
 */
export interface GeneratedSymbol<T extends GeneratedEntity = GeneratedEntity> {
  module: W2CModuleBase;
  localName: string;
  mangledLocalName: string;
  functionSymbolAccessorName: string;
  target: T;
}

/**
 * Information about a generated function
 */
export interface GeneratedModuleFunction {
  kind: 'function';
  parameterTypeNames: string[];
  parametersTypes: ResultType;
  resultTypes: ResultType;
  returnTypeName: string;
}

export type GeneratedEntity =
  | GeneratedModuleFunction
  | ModuleGlobal
  | ModuleMemory
  | ModuleTable;

export type ResolvedModuleImport<
  TSymbol extends GeneratedEntity = GeneratedEntity,
> = GeneratedSymbol<TSymbol>;

export type GeneratedEntityKind = GeneratedEntity['kind'];
