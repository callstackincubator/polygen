import stripIndent from 'strip-indent';
import type { Plugin } from '../../plugin.js';

/**
 * Plugin that generates the ReactNativeWebAssemblyHost podspec.
 */
export function cocoapods(): Plugin {
  return {
    name: 'core/ios-cocoapods',

    async finalizeCodegen({ output }): Promise<void> {
      await output.writeAllTo({
        'ReactNativeWebAssemblyHost.podspec': buildPodspecSource(),
      });
    },
  };
}

/**
 * Builds the podspec source for the ReactNativeWebAssemblyHost pod.
 */
function buildPodspecSource() {
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
      s.version      = package["version"] || "0.0.1"
      s.summary      = package["description"] || "No summary"
      s.homepage     = package["homepage"] || "no-homepage"
      s.license      = package["license"] || "Unknown License"
      s.authors      = package["author"] || "Unknown Author"
      if package["repository"]
        s.source       = { :git => package["repository"]["url"], :tag => "#{s.version}" }
      else
        s.source = { :git => "Unknown Source", :tag => "master" }
      end

      s.platforms    = { :ios => min_ios_version_supported }
      s.source_files = "*.{h,hpp,c,cpp}", "**/*.{h,hpp,c,cpp}"
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
