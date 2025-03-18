import type { W2CGeneratedModule } from '../codegen/modules.js';
import { cpp } from '../source-builder/index.js';
import { HEADER } from './common.js';

export function buildLoaderSource(generatedModules: W2CGeneratedModule[]) {
  const moduleBagType = new cpp.TypeBuilder('ModuleBag');

  function makeModuleFactoryDecl(module: W2CGeneratedModule) {
    return `std::shared_ptr<Module> ${module.moduleFactoryFunctionName}();`;
  }

  const moduleEntries = generatedModules.map((m) =>
    cpp.exprs.initializerListOf([
      cpp.exprs.string(m.name),
      cpp.exprs.string(m.checksum.toString('hex')),
      cpp.exprs.symbol(m.moduleFactoryFunctionName),
    ])
  );

  const moduleBagVar = new cpp.VariableBuilder('moduleBag')
    .withType(moduleBagType.asConst())
    .withInitializer((v) => v.listOf(moduleEntries, true), true);

  const moduleBagGetterFunc = new cpp.FunctionBuilder('getModuleBag')
    .withReturnType(moduleBagVar.type.asRef())
    .withBody((b) => b.return_(moduleBagVar.name));

  const builder = new cpp.SourceFileBuilder(true);
  builder
    .insertRaw(HEADER)
    .includeSystem('ReactNativePolygen/Loader.h')
    .spacing(1)
    .namespace('callstack::polygen::generated', (builder) =>
      builder
        .writeManyLines(generatedModules, makeModuleFactoryDecl)
        .spacing(1)
        .defineVariable(moduleBagVar)
        .defineFunction(moduleBagGetterFunc)
    );

  return builder.toString();
}
