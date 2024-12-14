#pragma once

#include <ReactCommon/TurboModule.h>
#include <RNPolygenSpecJSI.h>
#include <ReactNativePolygen/WebAssembly.h>

namespace facebook::react {

using NativeType = NativePolygenNativeType;
using NativeSymbolKind = NativePolygenNativeSymbolKind;
using NativeGlobalDescriptor = NativePolygenNativeGlobalDescriptor<NativeType, bool>;

using NativeExportDescriptor = NativePolygenModuleExportDescriptor<
  /* name */ std::string,
  /* kind */ NativeSymbolKind
>;
using NativeImportDescriptor = NativePolygenModuleImportDescriptor<
  /* module */ std::string,
  /* name */ std::string,
  /* kind */ NativeSymbolKind
>;
using NativeModuleMetadata = NativePolygenInternalModuleMetadata<
  /* imports */ std::vector<NativeImportDescriptor>,
  /* exports */ std::vector<NativeExportDescriptor>
>;

using NativeTableElementType = NativePolygenNativeTableElementType;
using NativeTableDescriptor = NativePolygenNativeTableDescriptor<
  /* initialSize */ double,
  /* maxSize */ std::optional<double>,
  /* element */ NativeTableElementType
>;
using NativeTableDescriptorBridging = NativePolygenNativeTableDescriptorBridging<NativeTableDescriptor>;

template <>
struct Bridging<NativeGlobalDescriptor> : public NativePolygenNativeGlobalDescriptorBridging<NativeGlobalDescriptor> {};
template <>
struct Bridging<NativeImportDescriptor> : public NativePolygenModuleImportDescriptorBridging<NativeImportDescriptor> {};
template <>
struct Bridging<NativeExportDescriptor> : public NativePolygenModuleExportDescriptorBridging<NativeExportDescriptor> {};
template <>
struct Bridging<NativeModuleMetadata> : public NativePolygenInternalModuleMetadataBridging<NativeModuleMetadata> {};

class ReactNativePolygen : public NativePolygenCxxSpecJSI {
public:
  constexpr static auto kModuleName = "Polygen";

  explicit ReactNativePolygen(std::shared_ptr<CallInvoker> jsInvoker);
  virtual ~ReactNativePolygen();

  // Modules
  jsi::Object loadModule(jsi::Runtime &rt, jsi::Object holder, jsi::Object moduleData) override;
  void unloadModule(jsi::Runtime &rt, jsi::Object moduleHolder) override;
  jsi::Object getModuleMetadata(jsi::Runtime &rt, jsi::Object moduleHolder) override;

  void createModuleInstance(jsi::Runtime &rt, jsi::Object instanceHolder, jsi::Object moduleHolder, jsi::Object importObject) override;
  void destroyModuleInstance(jsi::Runtime &rt, jsi::Object instance) override;

  // Memories
  void createMemory(jsi::Runtime &rt, jsi::Object holder, double initial, std::optional<double> maximum) override;
  jsi::Object getMemoryBuffer(jsi::Runtime &rt, jsi::Object instance) override;
  void growMemory(jsi::Runtime &rt, jsi::Object instance, double delta) override;

  // Globals
  void createGlobal(jsi::Runtime &rt, jsi::Object holder, jsi::Object globalDescriptor, double initialValue) override;
  double getGlobalValue(jsi::Runtime &rt, jsi::Object instance) override;
  void setGlobalValue(jsi::Runtime &rt, jsi::Object instance, double newValue) override;

  // Tables
  void createTable(jsi::Runtime &rt, jsi::Object holder, jsi::Object tableDescriptor) override;
  void growTable(jsi::Runtime &rt, jsi::Object instance, double delta) override;
  jsi::Object getTableElement(jsi::Runtime &rt, jsi::Object instance, double index) override;
  void setTableElement(jsi::Runtime &rt, jsi::Object instance, double index, jsi::Object value) override;
  double getTableSize(jsi::Runtime &rt, jsi::Object instance) override;
  
private:
  // Utility
  jsi::Object buildModuleMetadata(jsi::Runtime &rt, const std::shared_ptr<callstack::polygen::Module>& mod);
};

}


