import type {
  ModuleMemory,
  ModuleTable,
  ValueType,
} from '@callstack/wasm-parser';
import stripIndent from 'strip-indent';
import type { W2CGeneratedModule } from '../../codegen/modules.js';
import type {
  GeneratedModuleFunction,
  GeneratedSymbol,
} from '../../codegen/types.js';
import {
  HEADER,
  STRUCT_TYPE_PREFIX,
  TABLE_KIND_TO_CLASS_NAME,
  fromJSINumber,
  toJSINumber,
} from '../common.js';

export function buildExportBridgeHeader(module: W2CGeneratedModule) {
  const imports = module.importedModules;
  const includes = imports.map((i) => `#include "${i.name}-imports.h"`);

  return (
    HEADER +
    stripIndent(`
      #pragma once
      #include "${module.name}.h"
      ${includes.join('\n      ')}

      namespace callstack::polygen::generated {

      class ${module.generatedClassName}ModuleContext: public facebook::jsi::NativeState {
      public:
        ${module.generatedClassName}ModuleContext(facebook::jsi::Runtime& rt, facebook::jsi::Object&& importObject)
          : importObject(std::move(importObject))
          ${imports.map((i) => `, INIT_IMPORT_CTX(${i.generatedRootContextFieldName}, "${i.name}")`).join('\n        ')}
        {}

        facebook::jsi::Object importObject;
        ${module.generatedContextTypeName} rootCtx;
        ${imports.map((i) => `${i.generatedContextTypeName} ${i.generatedRootContextFieldName};`).join('\n      ')}
      };

      void create${module.generatedClassName}Exports(facebook::jsi::Runtime &rt, facebook::jsi::Object& target, facebook::jsi::Object&& importObject);

      }
`)
  );
}

function wrapNativeReturnIntoJSI(varName: string, types: ValueType[]) {
  if (types.length > 1) {
    const elements = types
      .map((t, i) => toJSINumber(`${varName}.${STRUCT_TYPE_PREFIX[t]}${i}`, t))
      .map((e) => `, ${e}`)
      .join('');

    return `return jsi::Array::createWithElements(rt${elements})`;
  }

  if (types.length === 1) {
    return `return ${toJSINumber(varName, types[0]!)}`;
  }

  return 'return jsi::Value::undefined()';
}

export function buildExportBridgeSource(module: W2CGeneratedModule) {
  function makeExportFunc(func: GeneratedSymbol<GeneratedModuleFunction>) {
    const { resultTypes, parameterTypeNames, parametersTypes } = func.target;

    const args = parametersTypes
      .map((type, i) =>
        fromJSINumber(`args[${i}]`, type, parameterTypeNames[i]!)
      )
      .map((e) => `, ${e}`)
      .join('');
    const res = resultTypes.length > 0 ? 'auto res = ' : '';

    return `
      /* export: '${func.localName}' */
      exports.setProperty(rt, "${func.localName}", HOSTFN("${func.localName}", ${parameterTypeNames.length}) {
        ${res}${func.functionSymbolAccessorName}(&inst->rootCtx${args});
        ${wrapNativeReturnIntoJSI('res', resultTypes)};
      }));
    `;
  }

  function makeExportMemory(mem: GeneratedSymbol<ModuleMemory>) {
    return `
      /* exported memory: '${mem.localName}' */
      {
        jsi::Object holder {rt};
        auto memory = std::make_shared<Memory>(${mem.functionSymbolAccessorName}(&inst->rootCtx));
        holder.setNativeState(rt, std::move(memory));
        memories.setProperty(rt, "${mem.localName}", std::move(holder));
      }
    `;
  }

  function makeExportTable(table: GeneratedSymbol<ModuleTable>) {
    const className = TABLE_KIND_TO_CLASS_NAME[table.target.elementType];
    return `
      /* exported table: '${table.localName}' */
      {
        jsi::Object holder {rt};
        auto table = std::make_shared<${className}>(${table.functionSymbolAccessorName}(&inst->rootCtx));
        holder.setNativeState(rt, std::move(table));
        tables.setProperty(rt, "${table.localName}", std::move(holder));
      }
    `;
  }

  const initArgs = module.importedModules
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

    namespace callstack::polygen::generated {
      void create${module.generatedClassName}Exports(jsi::Runtime &rt, jsi::Object& target, jsi::Object&& importObject) {
        if (!wasm_rt_is_initialized()) {
          wasm_rt_init();
        }

        auto inst = std::make_shared<${module.contextClassName}>(rt, std::move(importObject));
        wasm2c_${module.mangledName}_instantiate(&inst->rootCtx${initArgs});

        target.setNativeState(rt, inst);

        // Memories
        jsi::Object memories {rt};
        ${module.exportedMemories.map(makeExportMemory).join('\n        ')}
        target.setProperty(rt, "memories", std::move(memories));

        // Tables
        jsi::Object tables {rt};
        ${module.exportedTables.map(makeExportTable).join('\n        ')}
        target.setProperty(rt, "tables", std::move(tables));

        // Exported functions
        jsi::Object exports {rt};
        ${module.exportedFunctions.map(makeExportFunc).join('\n        ')}
        exports.setNativeState(rt, inst);
        target.setProperty(rt, "exports", std::move(exports));
      }
    }
  `)
  );
}
