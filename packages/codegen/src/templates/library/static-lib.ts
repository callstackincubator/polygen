import type { ModuleSymbol } from '@callstack/wasm-parser';
import stripIndent from 'strip-indent';
import { W2CModuleContext } from '../../context/context.js';
import { HEADER } from '../common.js';

export function buildStaticLibraryHeader(module: W2CModuleContext) {
  const className = `WASM${module.turboModule.generatedClassName}Module`;

  return (
    HEADER +
    stripIndent(`
    #pragma once
    #include <ReactNativePolygen/StaticLibraryModule.h>

    namespace callstack::polygen::generated {

    std::shared_ptr<callstack::polygen::Module> ${module.turboModule.moduleFactoryFunctionName}();

    class ${className}: public callstack::polygen::StaticLibraryModule {
    public:
      ${className}(const std::string& name): StaticLibraryModule(name) {}
      const std::vector<ImportInfo>& getImports() const override;
      const std::vector<ExportInfo>& getExports() const override;
      void createInstance(facebook::jsi::Runtime& rt, facebook::jsi::Object& target, facebook::jsi::Object&& importObject) const override;
    };

    }
  `)
  );
}

const symbolTypeMapping: Record<ModuleSymbol['kind'], string> = {
  function: 'Module::SymbolKind::Function',
  memory: 'Module::SymbolKind::Memory',
  global: 'Module::SymbolKind::Global',
  table: 'Module::SymbolKind::Table',
};

export function buildStaticLibrarySource(module: W2CModuleContext) {
  const className = `WASM${module.turboModule.generatedClassName}Module`;
  const moduleImportsIter = module.codegen.imports
    .values()
    .map(
      (i) => `{"${i.module}", "${i.name}", ${symbolTypeMapping[i.target.kind]}}`
    );
  const moduleImports = [...moduleImportsIter].join(', ');
  const moduleExportsIter = module.codegen.exports
    .values()
    .map((e) => `{"${e.name}", ${symbolTypeMapping[e.target.kind]}}`);
  const moduleExports = [...moduleExportsIter].join(', ');

  return (
    HEADER +
    stripIndent(`
  #include "static-module.h"
  #include "jsi-exports-bridge.h"

  using namespace facebook;

  namespace callstack::polygen::generated {

  const std::vector<Module::ImportInfo> imports { ${moduleImports} };
  const std::vector<Module::ExportInfo> exports { ${moduleExports} };

  std::shared_ptr<Module> ${module.turboModule.moduleFactoryFunctionName}() {
    return std::make_shared<${className}>("${module.name}");
  }

  const std::vector<Module::ImportInfo>& ${className}::getImports() const {
    return imports;
  }

  const std::vector<Module::ExportInfo>& ${className}::getExports() const {
    return exports;
  }

  void ${className}::createInstance(jsi::Runtime& rt, facebook::jsi::Object& target, jsi::Object&& importObject) const {
    return create${module.turboModule.generatedClassName}Exports(rt, target, std::move(importObject));
  }

  }
  `)
  );
}
