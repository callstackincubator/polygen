import indentString from 'indent-string';
import stripIndent from 'strip-indent';
import type { W2CGeneratedModule } from '../codegen/modules.js';
import {
  toArgumentList,
  toInitializerList,
  toStringLiteral,
} from '../helpers/source-builder.js';
import { HEADER } from './common.js';

export function buildLoaderSource(generatedModules: W2CGeneratedModule[]) {
  const moduleNames = toArgumentList(generatedModules, (el) => el.name);

  const moduleChecksums = generatedModules
    .map(({ name, checksum }) =>
      toInitializerList([name, checksum.toString('hex')], toStringLiteral)
    )
    .join(',\n      ')
    .trimEnd()
    .replace(/,$/, '');

  const moduleFactoriesMap = generatedModules
    .map(({ checksum, moduleFactoryFunctionName }) =>
      toInitializerList(
        [checksum.toString('hex'), moduleFactoryFunctionName],
        toStringLiteral
      )
    )
    .join(',\n      ')
    .trimEnd();

  function makeModuleFactoryDecl(module: W2CGeneratedModule) {
    return `std::shared_ptr<Module> ${module.moduleFactoryFunctionName}();`;
  }

  function makeModuleHandler(module: W2CGeneratedModule) {
    return stripIndent(
      `if (name == "${module.name}") { return ${module.moduleFactoryFunctionName}(); }`
    );
  }

  return (
    HEADER +
    stripIndent(`
    #include <sstream>
    #include <ReactNativePolygen/w2c.h>
    #include <ReactNativePolygen/checksum.h>
    #include <ReactNativePolygen/bridge.h>

    namespace callstack::polygen::generated {

    using ModuleFactoryFunction = std::function<std::shared_ptr<Module>()>;

    ${generatedModules.map(makeModuleFactoryDecl).join('\n    ')}

    const std::vector<std::string> moduleNames { ${moduleNames} };
    // TODO: skip in release
    const std::unordered_map<std::string, std::string> moduleChecksums {
      ${moduleChecksums}
    };
    std::unordered_map<std::string, ModuleFactoryFunction> moduleFactoryByChecksum {
      ${moduleFactoriesMap}
    };

    const std::vector<std::string>& getAvailableModules() {
      return moduleNames;
    }

    std::shared_ptr<Module> loadWebAssemblyModule(std::span<uint8_t> moduleData) {
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
    }

    }
  `)
  );
}
