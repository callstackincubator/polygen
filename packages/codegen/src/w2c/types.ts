import type {
  ModuleExport,
  ModuleFunction,
  ModuleImport,
  ModuleSymbol,
} from '@callstack/wasm-parser';
import type { W2CCodegenLocalImportedModule } from './context/index.js';

export interface GeneratedFunctionInfo {
  parameterTypeNames: string[];
  returnTypeName: string;
}

export interface GeneratedImport<T = ModuleSymbol> extends ModuleImport<T> {
  mangledName: string;
  moduleInfo: W2CCodegenLocalImportedModule;
  generatedFunctionName: string;
}

export type GeneratedFunctionImport = GeneratedImport<ModuleFunction> &
  GeneratedFunctionInfo;

export interface GeneratedExport<T = ModuleSymbol> extends ModuleExport<T> {
  mangledName: string;
  generatedFunctionName: string;
}

export type GeneratedFunctionExport = GeneratedExport<ModuleFunction> &
  GeneratedFunctionInfo;
