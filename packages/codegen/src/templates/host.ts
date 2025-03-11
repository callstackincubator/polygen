import indentString from 'indent-string';
import stripIndent from 'strip-indent';
import type { W2CGeneratedModule } from '../codegen/modules.js';
import {
  toArgumentList,
  toInitializerList,
  toStringLiteral,
} from '../helpers/source-builder.js';
import * as cpp from '../source-builder/builder.js';
import { FunctionBuilder, VariableBuilder } from '../source-builder/builder.js';
import { TypeBuilder } from '../source-builder/builder.types.js';
import { HEADER } from './common.js';

export function buildLoaderSource(generatedModules: W2CGeneratedModule[]) {
  // std::shared_ptr<Module>
  const moduleRefType = new TypeBuilder('Module').asSharedPtr();

  const moduleNames = toArgumentList(generatedModules, (el) => el.name);

  const moduleChecksums = generatedModules.map(({ name, checksum }) =>
    toInitializerList([name, checksum.toString('hex')], toStringLiteral)
  );

  const moduleFactoriesMap = generatedModules.map(
    ({ checksum, moduleFactoryFunctionName }) =>
      toInitializerList(
        [checksum.toString('hex'), moduleFactoryFunctionName],
        toStringLiteral
      )
  );

  function makeModuleFactoryDecl(module: W2CGeneratedModule) {
    return `std::shared_ptr<Module> ${module.moduleFactoryFunctionName}();`;
  }

  function makeModuleHandler(module: W2CGeneratedModule) {
    return stripIndent(
      `if (name == "${module.name}") { return ${module.moduleFactoryFunctionName}(); }`
    );
  }

  const moduleNamesVar = new VariableBuilder('moduleNames')
    .withType((t) => t.stringVector.asConst())
    .withInitializer((v) => moduleNames);

  // TODO: skip in release
  const moduleChecksumsVar = new VariableBuilder('moduleChecksums')
    .withType((t) => t.map(t.string, t.string))
    .withInitializer((v) => moduleChecksums);

  const moduleFactoryByChecksumVar = new VariableBuilder(
    'moduleFactoryByChecksum'
  )
    .withType((t) => t.map(t.string, t.of('ModuleFactoryFunction')))
    .withInitializer((v) => moduleFactoriesMap);

  const moduleNamesGetter = new FunctionBuilder('getAvailableModules')
    .withReturnType(moduleNamesVar.type.asRef())
    .withBody((b) => b.return_(moduleNamesVar.name));

  const loadWebAssemblyModuleFunc = new FunctionBuilder('loadWebAssemblyModule')
    .addParameter({ type: 'std::span<uint8_t>', name: 'moduleData' })
    .withReturnType(moduleRefType)
    .withBody((b) =>
      b.insertRaw(`
      if (ModuleMetadataView::isMetadata(moduleData)) {
        auto metadata = ModuleMetadataView::fromBuffer(moduleData);
        auto& name = metadata->getName();

        // TODO: skip in release
        if (auto foundModule = moduleChecksums.find(metadata->checksum); foundModule != moduleChecksums.end()) {
          std::ostringstream errorMsgStream;
          errorMsgStream << "Module checksums for '" << name << "' differ, this means that the precompiled module is different from the one that was generated. Perhaps you forgot to rebuild the project?";
          throw LoaderError { errorMsgStream.str() };
        }

        ${indentString(generatedModules.map(makeModuleHandler).join('\n'), 8).trimStart()}
        std::ostringstream errorMsgStream;
        errorMsgStream << "Failed to load WebAssembly Module '" << name << "'. The module is not precompiled. Perhaps you forgot to run 'polygen generate'?";
        throw LoaderError { errorMsgStream.str() };
      } else {
        auto checksum = computeSHA256(moduleData);
        if (auto foundModule = moduleFactoryByChecksum.find(checksum); foundModule != moduleFactoryByChecksum.end()) {
          return foundModule->second();
        }

        throw LoaderError { "Tried to load an unknown WebAssembly Module from binary buffer. Polygen can only load statically precompilied modules." };
      }
      `)
    );

  const builder = new cpp.SourceFileBuilder();
  builder
    .insertRaw(HEADER)
    .includeSystem('sstream')
    .includeSystem('ReactNativePolygen/w2c.h')
    .includeSystem('ReactNativePolygen/checksum.h')
    .includeSystem('ReactNativePolygen/bridge.h')
    .spacing(1)
    .namespace('callstack::polygen::generated', (builder) =>
      builder
        .using(
          'ModuleFactoryFunction',
          builder.type((t) => t.function(t.of('Module').asSharedPtr(), []))
        )
        .writeManyLines(generatedModules, makeModuleFactoryDecl)
        .spacing(1)
        .defineVariable(moduleNamesVar)
        .defineVariable(moduleChecksumsVar)
        .defineVariable(moduleFactoryByChecksumVar)
        .defineFunction(moduleNamesGetter)
        .defineFunction(loadWebAssemblyModuleFunc)
    );

  return builder.toString();
}
