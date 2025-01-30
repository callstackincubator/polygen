import type {
  ModuleGlobal,
  ModuleMemory,
  ModuleTable,
  RefType,
} from '@callstack/wasm-parser';
import stripIndent from 'strip-indent';
import { W2CImportedModule } from '../../context/index.js';
import type { GeneratedFunctionImport, GeneratedImport } from '../../types.js';
import { HEADER } from '../common.js';

const TABLE_KIND_TO_NATIVE_C_TYPE: Record<RefType, string> = {
  funcref: 'wasm_rt_funcref_table_t',
  externref: 'wasm_rt_externref_table_t',
};

const TABLE_KIND_TO_CLASS_NAME: Record<RefType, string> = {
  funcref: 'FuncRefTable',
  externref: 'ExternRefTable',
};

export function buildImportBridgeHeader(importedModule: W2CImportedModule) {
  function makeDeclaration(symbol: GeneratedImport): string {
    switch (symbol.target.kind) {
      case 'function':
        return makeImportFunc(symbol as GeneratedFunctionImport, false);
      case 'global':
        return makeImportGlobal(symbol as GeneratedImport<ModuleGlobal>, false);
      case 'memory':
        return makeImportMemory(symbol as GeneratedImport<ModuleMemory>, false);
      case 'table':
        return makeImportTable(symbol as GeneratedImport<ModuleTable>, false);
      default:
        // @ts-ignore
        console.warn('Unknown import type', symbol.target.kind);
        return '';
    }
  }

  const decls = importedModule.imports.map(makeDeclaration).join('\n');

  return (
    HEADER +
    stripIndent(`
    #pragma once
    #include <jsi/jsi.h>
    #include <wasm-rt.h>
    #include <ReactNativePolygen/gen-utils.h>

    struct ${importedModule.generatedContextTypeName} {
      void* root;
      facebook::jsi::Runtime& rt;
      facebook::jsi::Object importObj;
    };

    #ifdef __cplusplus
    extern "C" {
    #endif

    ${decls}

    #ifdef __cplusplus
    }
    #endif
    `)
  );
}

export function buildImportBridgeSource(importedModule: W2CImportedModule) {
  function makeImport(imp: GeneratedImport): string {
    switch (imp.target.kind) {
      case 'function':
        return makeImportFunc(imp as GeneratedFunctionImport, true);
      case 'global':
        return makeImportGlobal(imp as GeneratedImport<ModuleGlobal>, true);
      case 'memory':
        return makeImportMemory(imp as GeneratedImport<ModuleMemory>, true);
      case 'table':
        return makeImportTable(imp as GeneratedImport<ModuleTable>, true);
      default:
        // @ts-ignore
        console.warn('Unknown import type', imp.target.kind);
        return '';
    }
  }

  return (
    HEADER +
    stripIndent(`
    #include "${importedModule.name}-imports.h"
    #include <ReactNativePolygen/WebAssembly.h>
    #include <ReactNativePolygen/NativeStateHelper.h>

    using namespace facebook;
    using namespace callstack::polygen;

    #ifdef __cplusplus
    extern "C" {
    #endif

    ${importedModule.imports.map((i) => makeImport(i)).join('\n')}

    #ifdef __cplusplus
    }
    #endif
  `)
  );
}

function makeImportFunc(
  func: GeneratedFunctionImport,
  withBody: boolean
): string {
  const declarationParams = func.parameterTypeNames
    .map((name, i) => `, ${name} arg${i}`)
    .join('');

  const args = func.parameterTypeNames
    .map((_, i) => `, jsi::Value { (double)arg${i} }`)
    .join('');

  const returnKeyword = func.target.resultTypes.length > 0 ? 'return ' : '';
  const castSuffix = func.target.resultTypes.length > 0 ? '.asNumber()' : '';

  const prototype = `${func.returnTypeName} ${func.generatedFunctionName}(${func.moduleInfo.generatedContextTypeName}* ctx${declarationParams})`;
  const body = `{
    auto fn = ctx->importObj.getPropertyAsFunction(ctx->rt, "${func.name}");
    ${returnKeyword}fn.call(ctx->rt${args})${castSuffix};
  }
  `;

  return `
    /* import: '${func.module}' '${func.name}' */
    ${prototype}${withBody ? body : ';'}
  `;
}

function makeImportGlobal(
  global: GeneratedImport<ModuleGlobal>,
  withBody: boolean
): string {
  const cType = global.target.type.replace('i', 'u') + '*';
  const prototype = `${cType} ${global.generatedFunctionName}(${global.moduleInfo.generatedContextTypeName}* ctx)`;
  const body = `{
      auto obj = ctx->importObj.getPropertyAsObject(ctx->rt, "${global.name}");
      auto global = NativeStateHelper::tryGet<Global>(ctx->rt, obj);
      return (${cType})global->getUnsafePayloadPtr();
    }
  `;

  return `
    /* import: '${global.module}' '${global.name}' */
    ${prototype}${withBody ? body : ';'}
  `;
}

function makeImportMemory(
  memory: GeneratedImport<ModuleMemory>,
  withBody: boolean
): string {
  const prototype = `wasm_rt_memory_t* ${memory.generatedFunctionName}(${memory.moduleInfo.generatedContextTypeName}* ctx)`;
  const body = `{
    auto memoryHolder = ctx->importObj.getPropertyAsObject(ctx->rt, "${memory.name}");
    auto memoryState = NativeStateHelper::tryGet<Memory>(ctx->rt, memoryHolder);
    return memoryState->getMemory();
  }`;

  return `
    /* import: '${memory.module}' '${memory.name}' */
    ${prototype}${withBody ? body : ';'}
  `;
}

function makeImportTable(
  table: GeneratedImport<ModuleTable>,
  withBody: boolean
): string {
  const prototype = `${TABLE_KIND_TO_NATIVE_C_TYPE[table.target.elementType]}* ${table.generatedFunctionName}(${table.moduleInfo.generatedContextTypeName}* ctx)`;
  const body = `{
    auto tableHolder = ctx->importObj.getPropertyAsObject(ctx->rt, "${table.name}");
    auto table = NativeStateHelper::tryGet<${TABLE_KIND_TO_CLASS_NAME[table.target.elementType]}>(ctx->rt, tableHolder);
    assert(table != nullptr);
    return table->getTableData();
  }`;

  return `
    /* import: '${table.module}' '${table.name}' */
    ${prototype}${withBody ? body : ';'}
  `;
}
