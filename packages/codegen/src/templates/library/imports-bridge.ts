import type {
  ModuleGlobal,
  ModuleMemory,
  ModuleTable,
} from '@callstack/wasm-parser';
import stripIndent from 'strip-indent';
import type { W2CExternModule } from '../../codegen/modules.js';
import type {
  GeneratedModuleFunction,
  GeneratedSymbol,
  ResolvedModuleImport,
} from '../../codegen/types.js';
import { matchSymbol } from '../../codegen/utils.js';
import {
  toArgumentList,
  toInitializerList,
} from '../../helpers/source-builder.js';
import {
  HEADER,
  STRUCT_TYPE_PREFIX,
  TABLE_KIND_TO_CLASS_NAME,
  TABLE_KIND_TO_NATIVE_C_TYPE,
  fromJSINumber,
  toJSINumber,
} from '../common.js';

export function buildImportBridgeHeader(importedModule: W2CExternModule) {
  function makeDeclaration(symbol: ResolvedModuleImport): string {
    try {
      return matchSymbol<string>(symbol, {
        func: (f) => makeImportFunc(f, false),
        global: (g) => makeImportGlobal(g, false),
        table: (t) => makeImportTable(t, false),
        memory: (m) => makeImportMemory(m, false),
      });
    } catch (e) {
      console.error('Failed to build import', symbol, e);
      return '';
    }
  }

  const decls = [...importedModule.exports.values().map(makeDeclaration)].join(
    '\n'
  );

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

export function buildImportBridgeSource(importedModule: W2CExternModule) {
  function makeImport(imp: ResolvedModuleImport): string {
    try {
      return matchSymbol<string>(imp, {
        func: (f) => makeImportFunc(f, true),
        global: (g) => makeImportGlobal(g, true),
        table: (t) => makeImportTable(t, true),
        memory: (m) => makeImportMemory(m, true),
      });
    } catch (e) {
      console.error('Failed to build import', imp, e);
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

    ${[...importedModule.exports.values().map((i) => makeImport(i))].join('\n')}

    #ifdef __cplusplus
    }
    #endif
  `)
  );
}

function wrapJSIReturnIntoNative(
  varName: string,
  func: ResolvedModuleImport<GeneratedModuleFunction>
) {
  const { resultTypes, returnTypeName } = func.target;

  // Handle multiple value types (struct)
  if (resultTypes.length > 1) {
    const elements = resultTypes.map((t, i) =>
      toJSINumber(`${varName}.${STRUCT_TYPE_PREFIX[t]}${i}`, t)
    );

    return `return ${toInitializerList(elements)}`;
  }

  if (resultTypes.length === 1) {
    return `return ${fromJSINumber('res', resultTypes[0]!, returnTypeName)}`;
  }

  return 'return';
}

function makeImportFunc(
  func: GeneratedSymbol<GeneratedModuleFunction>,
  withBody: boolean
): string {
  const { resultTypes, returnTypeName, parametersTypes, parameterTypeNames } =
    func.target;

  const declarationParams = parameterTypeNames
    .map((name, i) => `${name} arg${i}`)
    .map((e) => `, ${e}`)
    .join('');

  const args = parametersTypes
    .map((t, i) => toJSINumber(`arg${i}`, t))
    .map((e) => `, ${e}`)
    .join('');

  const hasReturn = resultTypes.length > 0;

  const prototype = `${returnTypeName} ${func.functionSymbolAccessorName}(${func.module.generatedContextTypeName}* ctx${declarationParams})`;
  const body = `{
    auto fn = ctx->importObj.getPropertyAsFunction(ctx->rt, "${func.localName}");
    ${hasReturn ? 'auto res = ' : ''}fn.call(ctx->rt${args});
    ${wrapJSIReturnIntoNative('res', func)};
  }
  `;

  return `
    /* import: '${func.module}' '${func.localName}' */
    ${prototype}${withBody ? body : ';'}
  `;
}

function makeImportGlobal(
  global: ResolvedModuleImport<ModuleGlobal>,
  withBody: boolean
): string {
  const cType = global.target.type.replace('i', 'u') + '*';
  const prototype = `${cType} ${global.functionSymbolAccessorName}(${global.module.generatedContextTypeName}* ctx)`;
  const body = `{
      auto target = ctx->importObj.getProperty(ctx->rt, "${global.localName}");

      if (target.isUndefined()) [[unlikely]] {
        throw jsi::JSError(ctx->rt, "Provided imported variable '${global.localName}' is not provided");
      }

      if (!target.isObject()) [[unlikely]] {
        throw jsi::JSError(ctx->rt, "Provided imported variable '${global.localName}' is not an instance of WebAssembly.Global");
      }

      auto obj = target.asObject(ctx->rt);
      auto global = NativeStateHelper::tryGet<Global>(ctx->rt, obj);
      return (${cType})global->getUnsafePayloadPtr();
    }
  `;

  return `
    /* import: '${global.module}' '${global.localName}' */
    ${prototype}${withBody ? body : ';'}
  `;
}

function makeImportMemory(
  memory: ResolvedModuleImport<ModuleMemory>,
  withBody: boolean
): string {
  const prototype = `wasm_rt_memory_t* ${memory.functionSymbolAccessorName}(${memory.module.generatedContextTypeName}* ctx)`;
  const body = `{
    auto memoryHolder = ctx->importObj.getPropertyAsObject(ctx->rt, "${memory.localName}");
    auto memoryState = NativeStateHelper::tryGet<Memory>(ctx->rt, memoryHolder);
    return memoryState->getMemory();
  }`;

  return `
    /* import: '${memory.module}' '${memory.localName}' */
    ${prototype}${withBody ? body : ';'}
  `;
}

function makeImportTable(
  table: ResolvedModuleImport<ModuleTable>,
  withBody: boolean
): string {
  const prototype = `${TABLE_KIND_TO_NATIVE_C_TYPE[table.target.elementType]}* ${table.functionSymbolAccessorName}(${table.module.generatedContextTypeName}* ctx)`;
  const body = `{
    auto tableHolder = ctx->importObj.getPropertyAsObject(ctx->rt, "${table.localName}");
    auto table = NativeStateHelper::tryGet<${TABLE_KIND_TO_CLASS_NAME[table.target.elementType]}>(ctx->rt, tableHolder);
    assert(table != nullptr);
    return table->getTableData();
  }`;

  return `
    /* import: '${table.module}' '${table.localName}' */
    ${prototype}${withBody ? body : ';'}
  `;
}
