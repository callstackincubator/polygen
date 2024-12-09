import { HEADER } from './common.js';
import { W2CModuleContext } from '../context.js';
import stripIndent from 'strip-indent';
import indentString from 'indent-string';

export function buildHostHeader() {
  return (
    HEADER +
    stripIndent(`
    #pragma once
    #include <span>
    #include <memory>
    #include <string>
    #include <vector>
    #include <jsi/jsi.h>
    #include <ReactNativePolygen/Module.h>

    namespace callstack::polygen::generated {

    const std::vector<std::string>& getAvailableModules();
    std::shared_ptr<Module> loadWebAssemblyModule(std::span<uint8_t> moduleData);

    }
  `).trimStart()
  );
}

export function buildHostSource(generatedModules: W2CModuleContext[]) {
  const moduleNames = generatedModules
    .map((module) => `"${module.name}"`)
    .join(', ')
    .trimEnd()
    .replace(/,$/, '');

  const moduleChecksumMap = generatedModules
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
    #include "loader.h"
    #include <ReactNativePolygen/w2c.h>
    #include <ReactNativePolygen/checksum.h>

    namespace callstack::polygen::generated {

    using ModuleFactoryFunction = std::function<std::shared_ptr<Module>()>;

    ${generatedModules.map(makeModuleFactoryDecl).join('\n    ')}

    const std::vector<std::string> moduleNames { ${moduleNames} };
    std::unordered_map<std::string, ModuleFactoryFunction> moduleFactoryByChecksum {
      ${moduleChecksumMap}
    };

    const std::vector<std::string>& getAvailableModules() {
      return moduleNames;
    }

    std::shared_ptr<Module> loadWebAssemblyModule(std::span<uint8_t> moduleData) {
      if (ModuleMetadataView::isMetadata(moduleData)) {
        auto metadata = ModuleMetadataView::fromBuffer(moduleData);
        auto& name = metadata.name;
        ${indentString(generatedModules.map(makeModuleHandler).join('\n'), 8).trimStart()}
        return nullptr;
      } else {
        auto checksum = computeSHA256(moduleData);
        if (auto foundModule = moduleFactoryByChecksum.find(checksum); foundModule != moduleFactoryByChecksum.end()) {
          return foundModule->second();
        }

        return nullptr;
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
