import type { ModuleEntityKind } from '@callstack/wasm-parser';
import type { W2CGeneratedModule } from '../../codegen/modules.js';
import { cpp } from '../../source-builder/index.js';
import { HEADER } from '../common.js';

export function buildStaticLibraryHeader(module: W2CGeneratedModule) {
  const moduleType = new cpp.TypeBuilder('callstack::polygen::Module');

  const moduleFactoryFunction = new cpp.FunctionBuilder(
    module.moduleFactoryFunctionName
  ).withReturnType(moduleType.asSharedPtr());

  const builder = new cpp.SourceFileBuilder(true)
    .insertRaw(HEADER)
    .writeIncludeGuard()
    .spacing()
    .includeSystem('ReactNativePolygen/StaticLibraryModule.h')
    .spacing();

  builder.namespace('callstack::polygen::generated', (builder) =>
    builder.defineFunction(moduleFactoryFunction)
  );

  return builder.toString();
}

const symbolTypeMapping: Record<ModuleEntityKind, string> = {
  function: 'Module::SymbolKind::Function',
  memory: 'Module::SymbolKind::Memory',
  global: 'Module::SymbolKind::Global',
  table: 'Module::SymbolKind::Table',
};

export function buildStaticLibrarySource(module: W2CGeneratedModule) {
  const abstractModuleType = new cpp.TypeBuilder('callstack::polygen::Module');
  const moduleType = new cpp.TypeBuilder(
    'callstack::polygen::StaticLibraryModule'
  );

  const moduleImports = module.imports
    .values()
    .map((i) =>
      cpp.exprs.initializerListOf([
        cpp.exprs.string(i.module.name),
        cpp.exprs.string(i.localName),
        cpp.exprs.symbol(symbolTypeMapping[i.target.kind]),
      ])
    );
  const moduleExports = module.exports
    .values()
    .map((ex) =>
      cpp.exprs.initializerListOf([
        cpp.exprs.string(ex.localName),
        cpp.exprs.symbol(symbolTypeMapping[ex.target.kind]),
      ])
    );

  const moduleVar = new cpp.VariableBuilder('moduleInfo')
    .withType(moduleType)
    .withInitializer(
      (i) =>
        i.listOf(
          [
            i.string(module.name),
            i.initializerListOf([...moduleImports]),
            i.initializerListOf([...moduleExports]),
            i.symbol(`create${module.generatedClassName}Exports`),
          ],
          true
        ),
      true
    );

  const moduleSharedVar = new cpp.VariableBuilder('moduleSharedInfo')
    .withType(abstractModuleType.asSharedPtr())
    .withInitializer((i) => i.symbol(moduleVar.name).addressOf());

  const moduleGetterFunc = new cpp.FunctionBuilder(
    module.moduleFactoryFunctionName
  )
    .withReturnType(moduleSharedVar.type)
    .withBody((b) => b.return_(moduleSharedVar.name));

  const builder = new cpp.SourceFileBuilder(false);
  builder
    .insertRaw(HEADER)
    .spacing()
    .includeLocal('static-module.h')
    .includeLocal('jsi-exports-bridge.h')
    .spacing(2);

  builder.usingNamespace('facebook');

  builder.namespace('callstack::polygen::generated', () =>
    builder
      .defineVariable(moduleVar)
      .defineVariable(moduleSharedVar)
      .defineFunction(moduleGetterFunc)
  );

  return builder.toString();
}
