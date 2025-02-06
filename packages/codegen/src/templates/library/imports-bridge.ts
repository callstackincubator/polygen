import type {
  ModuleGlobal,
  ModuleMemory,
  ModuleTable,
} from '@callstack/wasm-parser';
import stripIndent from 'strip-indent';
import { W2CImportedModule } from '../../context/index.js';
import type { GeneratedFunctionImport, GeneratedImport } from '../../types.js';
import {
  HEADER,
  STRUCT_TYPE_PREFIX,
  TABLE_KIND_TO_CLASS_NAME,
  TABLE_KIND_TO_NATIVE_C_TYPE,
  fromJSINumber,
  toJSINumber,
} from '../common.js';

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

function wrapJSIReturnIntoNative(
  varName: string,
  func: GeneratedFunctionImport
) {
  const { resultTypes } = func.target;

  // Handle multiple value types (struct)
  if (resultTypes.length > 1) {
    const elements = resultTypes
      .map((t, i) => toJSINumber(`${varName}.${STRUCT_TYPE_PREFIX[t]}${i}`, t))
      .join(', ');

    return `return { ${elements} }`;
  }

  if (resultTypes.length === 1) {
    return fromJSINumber('res', resultTypes[0]!, func.returnTypeName);
  }

  return 'return';
}

function makeImportFunc(
  func: GeneratedFunctionImport,
  withBody: boolean
): string {
  const { resultTypes } = func.target;

  const declarationParams = func.parameterTypeNames
    .map((name, i) => `${name} arg${i}`)
    .map((e) => `, ${e}`)
    .join('');

  const args = func.target.parametersTypes
    .map((t, i) => toJSINumber(`arg${i}`, t))
    .map((e) => `, ${e}`)
    .join('');

  const hasReturn = resultTypes.length > 0;

  const prototype = `${func.returnTypeName} ${func.generatedFunctionName}(${func.moduleInfo.generatedContextTypeName}* ctx${declarationParams})`;
  const body = `{
    auto fn = ctx->importObj.getPropertyAsFunction(ctx->rt, "${func.name}");
    ${hasReturn ? 'auto res = ' : ''}fn.call(ctx->rt${args});
    ${wrapJSIReturnIntoNative('res', func)};
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
      auto target = ctx->importObj.getProperty(ctx->rt, "${global.name}");

      if (target.isUndefined()) [[unlikely]] {
        throw jsi::JSError(ctx->rt, "Provided imported variable '${global.name}' is not provided");
      }

      if (!target.isObject()) [[unlikely]] {
        throw jsi::JSError(ctx->rt, "Provided imported variable '${global.name}' is not an instance of WebAssembly.Global");
      }

      auto obj = target.asObject(ctx->rt);
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
