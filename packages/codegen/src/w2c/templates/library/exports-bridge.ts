import { HEADER } from '../common.js';
import { W2CModuleContext } from '../../context.js';
import type { GeneratedExport, GeneratedFunctionExport } from '../../types.js';
import stripIndent from 'strip-indent';
import type { ModuleMemory } from '@callstack/wasm-parser';

export function buildExportBridgeHeader(module: W2CModuleContext) {
  return `
    ${HEADER}
    #pragma once
    #include "jsi-imports-bridge.h"

    namespace callstack::polygen::generated {

    facebook::jsi::Object create${module.turboModule.generatedClassName}Exports(facebook::jsi::Runtime &rt, facebook::jsi::Object&& importObject);

    }
`;
}

export function buildExportBridgeSource(
  module: W2CModuleContext,
  { hackAutoNumberCoerce }: { hackAutoNumberCoerce?: boolean } = {}
) {
  hackAutoNumberCoerce ??= false;

  const numberCoerceFunc = `
    double getNumericVal(const facebook::jsi::Value& val) {
      if (val.isBool()) {
        return (double)val.asBool();
      }
      return val.asNumber();
    }
  `;

  function makeExportFunc(func: GeneratedFunctionExport) {
    const args = func.parameterTypeNames
      .map(
        (_, i) =>
          `, ${hackAutoNumberCoerce ? `getNumericVal(args[${i}])` : `args[${i}].asNumber()`}`
      )
      .join('');
    const res = func.target.resultTypes.length > 0 ? 'auto res = ' : '';
    const returnPart =
      func.target.resultTypes.length > 0
        ? 'return jsi::Value { (double)res };'
        : 'return jsi::Value::undefined()';

    return `
      /* export: '${func.name}' */
      exports.setProperty(rt, "${func.name}", HOSTFN("${func.name}", ${func.parameterTypeNames.length}) {
        auto nativeState = get${module.turboModule.contextClassName}Context(rt, thisValue);
        assert(nativeState != nullptr);
        ${res}${func.generatedFunctionName}(&nativeState->rootCtx${args});
        ${returnPart};
      }));
    `;
  }

  function makeExportMemory(mem: GeneratedExport<ModuleMemory>) {
    return `
      /* exported memory: '${mem.name}' */
      {
        jsi::Object holder {rt};
        auto memory = std::make_shared<Memory>(${mem.generatedFunctionName}(&inst->rootCtx));
        holder.setNativeState(rt, std::move(memory));
        memories.setProperty(rt, "${mem.name}", std::move(holder));
      }
    `;
  }

  const initArgs = module.codegen.importedModules
    .map((mod) => `, &inst->${mod.generatedRootContextFieldName}`)
    .join('');

  return (
    HEADER +
    stripIndent(`
    #include <ReactNativePolygen/gen-utils.h>
    #include <ReactNativePolygen/Memory.h>
    #include "jsi-exports-bridge.h"
    #include "wasm-rt.h"
    #include "${module.name}.h"

    using namespace facebook;
    using namespace callstack::polygen;

    ${hackAutoNumberCoerce ? numberCoerceFunc : ''}

    namespace callstack::polygen::generated {
      std::shared_ptr<${module.turboModule.contextClassName}> get${module.turboModule.contextClassName}Context(jsi::Runtime& rt, const jsi::Value& val) {
        auto obj = val.asObject(rt);
        assert(obj.hasNativeState(rt));
        auto ctx = std::dynamic_pointer_cast<${module.turboModule.contextClassName}>(obj.getNativeState(rt));
        assert(ctx != nullptr);
        return ctx;
      }

      jsi::Object create${module.turboModule.generatedClassName}Exports(jsi::Runtime &rt, jsi::Object&& importObject) {
        jsi::Object mod { rt };

        if (!wasm_rt_is_initialized()) {
          wasm_rt_init();
        }

        auto inst = std::make_shared<${module.turboModule.contextClassName}>(rt, std::move(importObject));
        wasm2c_${module.codegen.mangledName}_instantiate(&inst->rootCtx${initArgs});

        mod.setNativeState(rt, inst);

        // Memories
        jsi::Object memories {rt};
        ${module.codegen.exportedMemories.map(makeExportMemory).join('\n        ')}
        mod.setProperty(rt, "memories", std::move(memories));

        // Exported functions
        jsi::Object exports {rt};
        ${module.codegen.exportedFunctions.map(makeExportFunc).join('\n        ')}
        exports.setNativeState(rt, inst);
        mod.setProperty(rt, "exports", std::move(exports));

        return std::move(mod);
      }
    }
  `)
  );
}
