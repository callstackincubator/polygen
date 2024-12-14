import indentString from 'indent-string';
import stripIndent from 'strip-indent';
import { W2CModuleContext } from '../context/context.js';
import { HEADER } from './common.js';

export function buildHostSource(generatedModules: W2CModuleContext[]) {
  const moduleNames = generatedModules
    .map((module) => `"${module.name}"`)
    .join(', ')
    .trimEnd()
    .replace(/,$/, '');

  const moduleChecksums = generatedModules
    .map(
      (module) => `{ "${module.name}", "${module.checksum.toString('hex')}" }`
    )
    .join(',\n      ')
    .trimEnd()
    .replace(/,$/, '');

  const moduleFactoriesMap = generatedModules
    .map(
      (module) =>
        `{ "${module.checksum.toString('hex')}", ${module.turboModule.moduleFactoryFunctionName} }`
    )
    .join(',\n      ')
    .trimEnd();

  function makeModuleFactoryDecl(module: W2CModuleContext) {
    return `std::shared_ptr<Module> ${module.turboModule.moduleFactoryFunctionName}();`;
  }

  function makeModuleHandler(module: W2CModuleContext) {
    return stripIndent(
      `if (name == "${module.name}") { return ${module.turboModule.moduleFactoryFunctionName}(); }`
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

export function buildPodspec() {
  return stripIndent(
    `
    require "json"
    project_dir = Pathname.new(__dir__)
    project_dir = project_dir.parent until
      File.exist?("#{project_dir}/package.json") ||
      project_dir.expand_path.to_s == '/'

    package = JSON.parse(File.read(File.join(project_dir, "package.json")))

    Pod::Spec.new do |s|
      s.name         = "ReactNativeWebAssemblyHost"
      s.version      = package["version"]
      s.summary      = package["description"]
      s.homepage     = package["homepage"]
      s.license      = package["license"]
      s.authors      = package["author"]
      s.source       = { :git => package["repository"]["url"], :tag => "#{s.version}" }

      s.platforms    = { :ios => min_ios_version_supported }
      s.source_files = "*.{h,hpp,c,cpp}", "*/*.{h,hpp,c,cpp}"
      s.pod_target_xcconfig = {
          "HEADER_SEARCH_PATHS" => "\\"$(PODS_ROOT)/boost\\"",
          "OTHER_CPLUSPLUSFLAGS" => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
          "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
      }

      # Use install_modules_dependencies helper to install the dependencies if React Native version >=0.71.0.
      # See https://github.com/facebook/react-native/blob/febf6b7f33fdb4904669f99d795eba4c0f95d7bf/scripts/cocoapods/new_architecture.rb#L79.
      if respond_to?(:install_modules_dependencies, true)
        install_modules_dependencies(s)
      else
        s.dependency "React-Core"

        # Don't install the dependencies when we run \`pod install\` in the old architecture.
        if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
          s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1 -O3"
          s.pod_target_xcconfig    = {
              "HEADER_SEARCH_PATHS" => "\\"$(PODS_ROOT)/boost\\"",
              "OTHER_CPLUSPLUSFLAGS" => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
              "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
          }
          s.dependency "React-Codegen"
          s.dependency "RCT-Folly"
          s.dependency "RCTRequired"
          s.dependency "RCTTypeSafety"
          s.dependency "ReactCommon/turbomodule/core"
        end
      end

      s.exclude_files = "**/FBReactNativeSpec-generated.mm", "**/RCTModulesConformingToProtocolsProvider.mm"
    end
  `
  ).trimStart();
}
