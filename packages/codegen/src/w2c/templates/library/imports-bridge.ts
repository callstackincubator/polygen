import { HEADER } from '../common.js';
import type { GeneratedFunctionImport, GeneratedImport } from '../../types.js';
import stripIndent from 'strip-indent';
import type { ModuleGlobal } from '@callstack/wasm-parser';
import { W2CImportedModule } from '../../context/index.js';

export function buildImportBridgeHeader(importedModule: W2CImportedModule) {
  function makeDeclaration(symbol: GeneratedImport): string {
    switch (symbol.target.kind) {
      case 'function': {
        return makeImportFunc(symbol as GeneratedFunctionImport, false);
      }
      case 'global':
        return `${symbol.target.type.replace('i', 'u')}* ${symbol.generatedFunctionName}(${importedModule.generatedContextTypeName}* ctx);`;
      default:
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
  function makeImportGlobal(global: GeneratedImport<ModuleGlobal>): string {
    const cType = global.target.type.replace('i', 'u') + '*';

    return `
      /* import: '${global.module}' '${global.name}' */
      ${cType} ${global.generatedFunctionName}(${global.moduleInfo.generatedContextTypeName}* ctx) {
        auto obj = ctx->importObj.getPropertyAsObject(ctx->rt, "${global.name}");
        auto global = NativeStateHelper::tryGet<Global>(ctx->rt, obj);
        return (${cType})global->getUnsafePayloadPtr();
      }
    `;
  }

  function makeImport(imp: GeneratedImport): string {
    switch (imp.target.kind) {
      case 'function':
        return makeImportFunc(imp as GeneratedFunctionImport, true);
      case 'global':
        return makeImportGlobal(imp as GeneratedImport<ModuleGlobal>);
      default:
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
