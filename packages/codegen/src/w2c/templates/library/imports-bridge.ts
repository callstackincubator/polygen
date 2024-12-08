import { HEADER } from '../common.js';
import { W2CModuleContext } from '../../context.js';
import type { GeneratedFunctionImport, GeneratedImport } from '../../types.js';
import stripIndent from 'strip-indent';
import type { ModuleGlobal } from '@callstack/wasm-parser';

export function buildImportBridgeHeader(module: W2CModuleContext) {
  const imports = module.codegen.importedModules;
  const importsContextDeclarations = imports.map(
    (importInfo) =>
      `GEN_IMPORT_CONTEXT_TYPE(${importInfo.generatedContextTypeName}, ${module.codegen.generatedContextTypeName});`
  );

  return (
    HEADER +
    stripIndent(`
    #pragma once
    #include <jsi/jsi.h>
    #include <ReactNativePolygen/gen-utils.h>
    #include "${module.name}.h"

    ${importsContextDeclarations.join('\n    ')}

    namespace callstack::polygen::generated {

    class ${module.turboModule.generatedClassName}ModuleContext: public facebook::jsi::NativeState {
    public:
      ${module.turboModule.generatedClassName}ModuleContext(facebook::jsi::Runtime& rt, facebook::jsi::Object&& importObject)
        : importObject(std::move(importObject))
        ${imports.map((i) => `, INIT_IMPORT_CTX(${i.generatedRootContextFieldName}, "${i.name}")`).join('\n        ')}
      {}

      facebook::jsi::Object importObject;
      ${module.codegen.generatedContextTypeName} rootCtx;
      ${imports.map((i) => `${i.generatedContextTypeName} ${i.generatedRootContextFieldName};`).join('\n      ')}
    };
    }
    `)
  );
}

export function buildImportBridgeSource(module: W2CModuleContext) {
  function makeImportFunc(func: GeneratedFunctionImport): string {
    const declarationParams = func.parameterTypeNames
      .map((name, i) => `, ${name} arg${i}`)
      .join(' ');

    const args = func.parameterTypeNames
      .map((_, i) => `, jsi::Value { (double)arg${i} }`)
      .join('');

    const returnKeyword = func.target.resultTypes.length > 0 ? 'return ' : '';
    const castSuffix = func.target.resultTypes.length > 0 ? '.asNumber()' : '';

    return `
      /* import: '${func.module}' '${func.name}' */
      ${func.returnTypeName} ${func.generatedFunctionName}(${func.moduleInfo.generatedContextTypeName}* ctx${declarationParams}) {
        auto fn = ctx->importObj.getPropertyAsFunction(ctx->rt, "${func.name}");
        ${returnKeyword}fn.call(ctx->rt${args})${castSuffix};
      }
    `;
  }

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
        return makeImportFunc(imp as GeneratedFunctionImport);
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
    #include "jsi-imports-bridge.h"
    #include <ReactNativePolygen/WebAssembly.h>
    #include <ReactNativePolygen/NativeStateHelper.h>

    using namespace facebook;
    using namespace callstack::polygen;

    #ifdef __cplusplus
    extern "C" {
    #endif

    ${module.codegen.imports.map((i) => makeImport(i)).join('\n    ')}

    #ifdef __cplusplus
    }
    #endif
  `)
  );
}
