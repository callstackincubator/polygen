import type {
  ModuleMemory,
  ModuleTable,
  ValueType,
} from '@callstack/wasm-parser';
import stripIndent from 'strip-indent';
import { W2CModuleContext } from '../../context/context.js';
import type { GeneratedExport, GeneratedFunctionExport } from '../../types.js';
import { HEADER, TABLE_KIND_TO_CLASS_NAME } from '../common.js';

export function buildExportBridgeHeader(module: W2CModuleContext) {
  const imports = module.codegen.importedModules;
  const includes = imports.map((i) => `#include "${i.name}-imports.h"`);

  return (
    HEADER +
    stripIndent(`
      #pragma once
      #include "${module.name}.h"
      ${includes.join('\n      ')}

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

      void create${module.turboModule.generatedClassName}Exports(facebook::jsi::Runtime &rt, facebook::jsi::Object& target, facebook::jsi::Object&& importObject);

      }
`)
  );
}

// https://github.com/WebAssembly/wabt/blob/46648b09614b8c675e49a0fa5831e2dd8125b11d/src/c-writer.cc#L655
const TYPE_MULTI_STRUCT_PREFIX: Record<ValueType, string> = {
  i32: 'i',
  i64: 'j',
  f32: 'f',
  f64: 'd',
  v128: 'o',
  funcref: 'r',
  externref: 'e',
  // exnref
};

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
    let returnPart = '';
    if (func.target.resultTypes.length > 1) {
      const elements = func.target.resultTypes
        .map(
          (t, i) =>
            `jsi::Value { (double)res.${TYPE_MULTI_STRUCT_PREFIX[t]}${i} }`
        )
        .join(', ');
      returnPart = `return jsi::Array::createWithElements(rt, ${elements})`;
    } else if (func.target.resultTypes.length === 1) {
      returnPart = 'return jsi::Value { (double)res }';
    } else {
      returnPart = 'return jsi::Value::undefined()';
    }

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

  function makeExportTable(table: GeneratedExport<ModuleTable>) {
    const className = TABLE_KIND_TO_CLASS_NAME[table.target.elementType];
    return `
      /* exported table: '${table.name}' */
      {
        jsi::Object holder {rt};
        auto table = std::make_shared<${className}>(${table.generatedFunctionName}(&inst->rootCtx));
        holder.setNativeState(rt, std::move(table));
        tables.setProperty(rt, "${table.name}", std::move(holder));
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
    #include <ReactNativePolygen/WebAssembly.h>
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

      void create${module.turboModule.generatedClassName}Exports(jsi::Runtime &rt, jsi::Object& target, jsi::Object&& importObject) {
        if (!wasm_rt_is_initialized()) {
          wasm_rt_init();
        }

        auto inst = std::make_shared<${module.turboModule.contextClassName}>(rt, std::move(importObject));
        wasm2c_${module.codegen.mangledName}_instantiate(&inst->rootCtx${initArgs});

        target.setNativeState(rt, inst);

        // Memories
        jsi::Object memories {rt};
        ${module.codegen.exportedMemories.map(makeExportMemory).join('\n        ')}
        target.setProperty(rt, "memories", std::move(memories));

        // Tables
        jsi::Object tables {rt};
        ${module.codegen.exportedTables.map(makeExportTable).join('\n        ')}
        target.setProperty(rt, "tables", std::move(tables));

        // Exported functions
        jsi::Object exports {rt};
        ${module.codegen.exportedFunctions.map(makeExportFunc).join('\n        ')}
        exports.setNativeState(rt, inst);
        target.setProperty(rt, "exports", std::move(exports));
      }
    }
  `)
  );
}
