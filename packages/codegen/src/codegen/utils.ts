import type {
  ModuleEntity,
  ModuleExport,
  ModuleGlobal,
  ModuleImport,
  ModuleMemory,
  ModuleTable,
  ValueType,
} from '@callstack/wasm-parser';
import { mangleName } from '../wasm2c/mangle.js';
import type { W2CModuleBase } from './modules.js';
import type {
  GeneratedEntity,
  GeneratedModuleFunction,
  GeneratedSymbol,
} from './types.js';

export function mangleSymbolName(name: string, mangledModule: string) {
  return `w2c_${mangledModule}_${mangleName(name)}`;
}

/**
 * Creates GeneratedEntity from ModuleEntity
 *
 * Only functions are augmented at the moment.
 *
 * @param entity Raw ModuleEntity
 */
export function processEntity(entity: ModuleEntity): GeneratedEntity {
  switch (entity.kind) {
    case 'function':
      const returnType = matchW2CRType(entity.resultTypes[0]);
      return {
        ...entity,
        parameterTypeNames: entity.parametersTypes.map(matchW2CRType),
        returnTypeName: returnType,
      };
    default:
      return entity;
  }
}

/**
 * Builds a GeneratedSymbol from ModuleImport or ModuleExport.
 *
 * @param module
 * @param entity
 */
export function buildGeneratedSymbol(
  module: W2CModuleBase,
  entity: ModuleImport | ModuleExport
): GeneratedSymbol {
  const accessorName = mangleSymbolName(entity.name, module.mangledName);

  return {
    localName: entity.name,
    mangledLocalName: mangleName(entity.name),
    functionSymbolAccessorName: accessorName,
    module,
    target: processEntity(entity.target),
  };
}

class SymbolMatchError extends Error {
  constructor(public kind: string) {
    super(`Unknown import type ${kind}`);
  }
}

export interface SymbolMatchHandler<TResult = void> {
  func: (func: GeneratedSymbol<GeneratedModuleFunction>) => TResult;
  global: (global: GeneratedSymbol<ModuleGlobal>) => TResult;
  table: (table: GeneratedSymbol<ModuleTable>) => TResult;
  memory: (memory: GeneratedSymbol<ModuleMemory>) => TResult;
}

/**
 * Matches a GeneratedSymbol to a handler based on its kind.
 *
 * Throws `SymbolMatchError` if the kind is unknown.
 *
 * @param symbol Symbol to match
 * @param matcher Handler to match the symbol based on its type
 */
export function matchSymbol<TResult = void>(
  symbol: GeneratedSymbol,
  matcher: SymbolMatchHandler<TResult>
): TResult {
  switch (symbol.target.kind) {
    case 'function':
      return matcher.func(symbol as GeneratedSymbol<GeneratedModuleFunction>);
    case 'global':
      return matcher.global(symbol as GeneratedSymbol<ModuleGlobal>);
    case 'memory':
      return matcher.memory(symbol as GeneratedSymbol<ModuleMemory>);
    case 'table':
      return matcher.table(symbol as GeneratedSymbol<ModuleTable>);
    default:
      // @ts-ignore
      throw new SymbolMatchError(symbol.target.kind);
  }
}

// TODO: workaround a bug(?) that all types are returned as either none, u32 or f64
export function matchW2CRType(t?: ValueType): string {
  if (!t) {
    return 'void';
  }

  // TODO: figure out why wasm2c returns u32 for number types sometimes
  if (t.startsWith('i')) {
    return t.replace(/^i/, 'u');
  }
  return t;
}
