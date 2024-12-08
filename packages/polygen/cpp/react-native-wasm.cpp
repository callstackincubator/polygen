#include <memory>
#include <span>
#include "bridge.h"
#include "react-native-wasm.h"
#include "WebAssembly.h"
#include "NativeStateHelper.h"

using namespace callstack::polygen;

namespace facebook::react {

ReactNativeWebAssembly::ReactNativeWebAssembly(std::shared_ptr<CallInvoker> jsInvoker)
: NativeWebAssemblyCxxSpecJSI(std::move(jsInvoker)) {
  wasm_rt_init();
}

ReactNativeWebAssembly::~ReactNativeWebAssembly() {
  wasm_rt_free();
}


jsi::Object ReactNativeWebAssembly::loadModule(jsi::Runtime &rt, jsi::Object moduleData) {
  auto buffer = moduleData.getArrayBuffer(rt);
  std::span<uint8_t> bufferView { buffer.data(rt), buffer.size(rt) };
  auto mod = generated::loadWebAssemblyModule(bufferView);

  return NativeStateHelper::wrap(rt, mod);
}

void ReactNativeWebAssembly::unloadModule(jsi::Runtime &rt, jsi::Object module) {
  module.setNativeState(rt, nullptr);
}

jsi::Object ReactNativeWebAssembly::getModuleMetadata(jsi::Runtime &rt, jsi::Object moduleHolder) {
  auto mod = NativeStateHelper::tryGet<Module>(rt, moduleHolder);
  auto imports = mod->getImports();
  auto exports = mod->getExports();

  auto resultObj = jsi::Object {rt};
  auto importsArray = jsi::Array {rt, imports.size()};
  auto exportsArray = jsi::Array {rt, exports.size()};

  auto index = 0;
  for (auto& import_ : imports) {
//    Bridging<NativeWebAssemblyModuleImportDescriptor<std::string, std::string, std::string>>;
    auto importObj = jsi::Object {rt};
    importObj.setProperty(rt, "module", import_.module);
    importObj.setProperty(rt, "name", import_.name);
    importObj.setProperty(rt, "kind", "function");
    importsArray.setValueAtIndex(rt, index++, importObj);
  }

  index = 0;
  for (auto& export_ : exports) {
    auto exportObj = jsi::Object {rt};
    exportObj.setProperty(rt, "name", export_.name);
    exportObj.setProperty(rt, "kind", "function");
    exportsArray.setValueAtIndex(rt, index++, exportObj);
  }

  resultObj.setProperty(rt, "imports", std::move(importsArray));
  resultObj.setProperty(rt, "exports", std::move(exportsArray));
  return resultObj;
}

jsi::Object ReactNativeWebAssembly::createModuleInstance(jsi::Runtime &rt, jsi::Object moduleHolder, jsi::Object importObject) {
  auto mod = NativeStateHelper::tryGet<Module>(rt, moduleHolder);

//  auto init = library->get<wasm_function_ptr>("wasm2c_example_instantiate");
//  auto free = library->get<wasm_function_ptr>("wasm2c_example_free");
//  auto fib = library->get<wasm_fib>("w2c_example_fib");

  return mod->createInstance(rt, std::move(importObject));
}

void ReactNativeWebAssembly::destroyModuleInstance(jsi::Runtime &rt, jsi::Object instance) {
  instance.setNativeState(rt, nullptr);
}


// Memories
void ReactNativeWebAssembly::createMemory(jsi::Runtime &rt, jsi::Object holder, double initial, std::optional<double> maximum) {
  auto maxPages = (uint64_t)maximum.value_or(100);
  auto memory = std::make_shared<Memory>((uint64_t)initial, maxPages, false);
  NativeStateHelper::attach(rt, holder, memory);
}

jsi::Object ReactNativeWebAssembly::getMemoryBuffer(jsi::Runtime &rt, jsi::Object instance) {
  auto memoryState = NativeStateHelper::tryGet<Memory>(rt, instance);

  jsi::ArrayBuffer buffer {rt, memoryState};
  return buffer;
}

void ReactNativeWebAssembly::growMemory(jsi::Runtime &rt, jsi::Object instance, double delta) {
  auto memory = NativeStateHelper::tryGet<Memory>(rt, instance);
  memory->grow((uint64_t)delta);
}


// Globals
void ReactNativeWebAssembly::createGlobal(jsi::Runtime &rt, jsi::Object holder, jsi::Value rawType, bool isMutable, double initialValue) {
  auto type = Bridging<NativeWebAssemblyNativeType>::fromJs(rt, rawType);
  auto waType = static_cast<Global::Type>((uint32_t)type);
  jsi::Value initial { initialValue };
  
  auto globalVar = std::make_shared<Global>(waType, std::move(initial), isMutable);
  NativeStateHelper::attach(rt, holder, globalVar);

}

double ReactNativeWebAssembly::getGlobalValue(jsi::Runtime &rt, jsi::Object instance) {
  auto globalVar = NativeStateHelper::tryGet<Global>(rt, instance);
  return globalVar->getValue().asNumber();
}

void ReactNativeWebAssembly::setGlobalValue(jsi::Runtime &rt, jsi::Object instance, double newValue) {
  auto globalVar = NativeStateHelper::tryGet<Global>(rt, instance);
  globalVar->setValue(rt, {newValue});
}


// Tables
void ReactNativeWebAssembly::createTable(jsi::Runtime &rt, jsi::Object holder, jsi::Object tableDescriptor) {
  auto descriptor = NativeTableDescriptorBridging::fromJs(rt, tableDescriptor, this->jsInvoker_);
  std::shared_ptr<Table> table;
  auto maxSizeNumber = descriptor.maxSize.has_value()
    ? std::make_optional((double)descriptor.maxSize.value())
    : std::nullopt;
  
  switch (descriptor.element) {
    case NativeTableElementType::AnyFunc:
      table = std::make_shared<FuncRefTable>((size_t)descriptor.initialSize, descriptor.maxSize);
      break;
    case NativeTableElementType::ExternRef:
      table = std::make_shared<ExternRefTable>((size_t)descriptor.initialSize, descriptor.maxSize);
      break;
    default:
      assert(0);
  }
  
  NativeStateHelper::attach(rt, holder, table);
}

void ReactNativeWebAssembly::growTable(jsi::Runtime &rt, jsi::Object instance, double delta) {
  auto table = NativeStateHelper::tryGet<Table>(rt, instance);
  table->grow(delta);
}

jsi::Object ReactNativeWebAssembly::getTableElement(jsi::Runtime &rt, jsi::Object instance, double index) {
  assert(0 && "Unsupported");
//  auto table = NativeStateHelper::tryGet<Table>(rt, instance);
//  
//  auto funcTable = std::dynamic_pointer_cast<FuncRefTable>(table);
//  if (funcTable) {
//    auto func = funcTable->getElement(index);
//    auto type = func.func_type;
//    return jsi::Function::createFromHostFunction(rt, "", type, )
//  }
}

void ReactNativeWebAssembly::setTableElement(jsi::Runtime &rt, jsi::Object instance, double index, jsi::Object value) {
  assert(0 && "Unsupported");
}

double ReactNativeWebAssembly::getTableSize(jsi::Runtime &rt, jsi::Object instance) {
  auto table = NativeStateHelper::tryGet<Table>(rt, instance);
  return table->getSize();
}

}
