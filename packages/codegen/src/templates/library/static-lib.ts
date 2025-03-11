import type { ModuleEntityKind } from '@callstack/wasm-parser';
import stripIndent from 'strip-indent';
import type { W2CGeneratedModule } from '../../codegen/modules.js';
import * as cpp from '../../source-builder/builder.js';
import { HEADER } from '../common.js';

export function buildStaticLibraryHeader(module: W2CGeneratedModule) {
  const className = `WASM${module.generatedClassName}Module`;

  return (
    HEADER +
    stripIndent(`
    #pragma once
    #include <ReactNativePolygen/StaticLibraryModule.h>

    namespace callstack::polygen::generated {

    std::shared_ptr<callstack::polygen::Module> ${module.moduleFactoryFunctionName}();

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

const symbolTypeMapping: Record<ModuleEntityKind, string> = {
  function: 'Module::SymbolKind::Function',
  memory: 'Module::SymbolKind::Memory',
  global: 'Module::SymbolKind::Global',
  table: 'Module::SymbolKind::Table',
};

export function buildStaticLibrarySource(module: W2CGeneratedModule) {
  const className = `WASM${module.generatedClassName}Module`;
  const moduleImportsIter = module.imports
    .values()
    .map(
      (i) =>
        `{"${i.module}", "${i.localName}", ${symbolTypeMapping[i.target.kind]}}`
    );
  const moduleImports = [...moduleImportsIter].join(', ');
  const moduleExportsIter = module.exports
    .values()
    .map((e) => `{"${e.localName}", ${symbolTypeMapping[e.target.kind]}}`);
  const moduleExports = [...moduleExportsIter].join(', ');

  const importsVar = new cpp.VariableBuilder('imports')
    .withType((t) => t.of('Module::ImportInfo').asVector().asConst())
    .withInitializer((e) => e.listOf(moduleImports));
  const exportsVar = new cpp.VariableBuilder('exports').withType((t) =>
    t.of('Module::ExportInfo').asVector().asConst()
  );

  // const builder = new cpp.SourceFileBuilder();
  //
  // builder
  //   .writeIncludeGuard()
  //   .includeLocal('static-module.h')
  //   .includeLocal('jsi-exports-bridge.h');
  //
  // builder.usingNamespace('facebook');
  //
  // builder.namespace('callstack::polygen::generated', () => builder);
  //
  // return builder.toString();

  return (
    HEADER +
    stripIndent(`
  #include "static-module.h"
  #include "jsi-exports-bridge.h"

  using namespace facebook;

  namespace callstack::polygen::generated {

  const std::vector<Module::ImportInfo> imports { ${moduleImports} };
  const std::vector<Module::ExportInfo> exports { ${moduleExports} };

  std::shared_ptr<Module> ${module.moduleFactoryFunctionName}() {
    return std::make_shared<${className}>("${module.name}");
  }

  const std::vector<Module::ImportInfo>& ${className}::getImports() const {
    return imports;
  }

  const std::vector<Module::ExportInfo>& ${className}::getExports() const {
    return exports;
  }

  void ${className}::createInstance(jsi::Runtime& rt, facebook::jsi::Object& target, jsi::Object&& importObject) const {
    return create${module.generatedClassName}Exports(rt, target, std::move(importObject));
  }

  }
  `)
  );
}
