/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#include <memory>
#include <span>

#include "ReactNativePolygen.h"
#include "bridge.h"
#include "NativeStateHelper.h"

using namespace callstack::polygen;

namespace facebook::react {
    ReactNativePolygen::ReactNativePolygen(std::shared_ptr<CallInvoker> jsInvoker)
        : NativePolygenCxxSpecJSI(std::move(jsInvoker)) {
        wasm_rt_init();
    }

    ReactNativePolygen::~ReactNativePolygen() {
        wasm_rt_free();
    }

    bool ReactNativePolygen::copyNativeHandle(jsi::Runtime &rt, jsi::Object holder, jsi::Object source) {
        auto hasNativeState = source.hasNativeState(rt);

        if (hasNativeState) {
            holder.setNativeState(rt, source.getNativeState(rt));
        }

        return hasNativeState;
    }


    jsi::Object ReactNativePolygen::loadModule(jsi::Runtime &rt, jsi::Object holder, jsi::Object moduleData) {
        auto buffer = moduleData.getArrayBuffer(rt);
        std::span<uint8_t> bufferView{buffer.data(rt), buffer.size(rt)};
        try {
            auto mod = generated::loadWebAssemblyModule(bufferView);
            NativeStateHelper::attach(rt, holder, mod);
            return buildModuleMetadata(rt, mod);
        } catch (const LoaderError &loaderError) {
            throw jsi::JSError(rt, loaderError.what());
        }
    }

    void ReactNativePolygen::unloadModule(jsi::Runtime &rt, jsi::Object module) {
        module.setNativeState(rt, nullptr);
    }

    jsi::Object ReactNativePolygen::getModuleMetadata(jsi::Runtime &rt, jsi::Object moduleHolder) {
        auto mod = NativeStateHelper::tryGet<Module>(rt, moduleHolder);
        return buildModuleMetadata(rt, mod);
    }

    void ReactNativePolygen::createModuleInstance(jsi::Runtime &rt, jsi::Object instanceHolder,
                                                  jsi::Object moduleHolder, jsi::Object importObject) {
        auto mod = NativeStateHelper::tryGet<Module>(rt, moduleHolder);
        mod->createInstance(rt, instanceHolder, std::move(importObject));
    }

    void ReactNativePolygen::destroyModuleInstance(jsi::Runtime &rt, jsi::Object instance) {
        instance.setNativeState(rt, nullptr);
    }


    // Memories
    void ReactNativePolygen::createMemory(jsi::Runtime &rt, jsi::Object holder, double initial,
                                          std::optional<double> maximum) {
        auto maxPages = (uint64_t) maximum.value_or(100);
        auto memory = std::make_shared<Memory>((uint64_t) initial, maxPages, false);
        NativeStateHelper::attach(rt, holder, memory);
    }

    jsi::Object ReactNativePolygen::getMemoryBuffer(jsi::Runtime &rt, jsi::Object instance) {
        auto memoryState = NativeStateHelper::tryGet<Memory>(rt, instance);

        jsi::ArrayBuffer buffer{rt, memoryState};
        return buffer;
    }

    void ReactNativePolygen::growMemory(jsi::Runtime &rt, jsi::Object instance, double delta) {
        auto memory = NativeStateHelper::tryGet<Memory>(rt, instance);
        memory->grow((uint64_t) delta);
    }


    // Globals
    void ReactNativePolygen::createGlobal(jsi::Runtime &rt, jsi::Object holder, jsi::Object globalDescriptor,
                                          double initialValue) {
        auto descriptor = Bridging<NativeGlobalDescriptor>::fromJs(rt, globalDescriptor, jsInvoker_);
        auto waType = static_cast<Global::Type>(descriptor.type);
        jsi::Value initial{initialValue};

        auto globalVar = std::make_shared<Global>(waType, std::move(initial), descriptor.isMutable);
        NativeStateHelper::attach(rt, holder, globalVar);
    }

    double ReactNativePolygen::getGlobalValue(jsi::Runtime &rt, jsi::Object instance) {
        auto globalVar = NativeStateHelper::tryGet<Global>(rt, instance);
        return globalVar->getValue().asNumber();
    }

    void ReactNativePolygen::setGlobalValue(jsi::Runtime &rt, jsi::Object instance, double newValue) {
        auto globalVar = NativeStateHelper::tryGet<Global>(rt, instance);
        globalVar->setValue(rt, {newValue});
    }


    // Tables
    void ReactNativePolygen::createTable(jsi::Runtime &rt, jsi::Object holder, jsi::Object tableDescriptor,
                                         std::optional<jsi::Object> initial) {
        auto descriptor = NativeTableDescriptorBridging::fromJs(rt, tableDescriptor, this->jsInvoker_);
        std::shared_ptr<Table> table;
        auto maxSizeNumber = descriptor.maxSize.has_value()
                                 ? std::make_optional((double) descriptor.maxSize.value())
                                 : std::nullopt;

        switch (descriptor.element) {
            case NativeTableElementType::AnyFunc:
                table = std::make_shared<FuncRefTable>((size_t) descriptor.initialSize, descriptor.maxSize);
                break;
            case NativeTableElementType::ExternRef:
                table = std::make_shared<ExternRefTable>((size_t) descriptor.initialSize, descriptor.maxSize);
                break;
            default:
                assert(0);
        }

        NativeStateHelper::attach(rt, holder, table);
    }

    void ReactNativePolygen::growTable(jsi::Runtime &rt, jsi::Object instance, double delta) {
        auto table = NativeStateHelper::tryGet<Table>(rt, instance);
        table->grow(delta);
    }

    jsi::Object ReactNativePolygen::getTableElement(jsi::Runtime &rt, jsi::Object instance, double index) {
        auto table = NativeStateHelper::tryGet<Table>(rt, instance);

        auto element = table->getElement(index);
        return NativeStateHelper::wrap(rt, element);
    }

    void ReactNativePolygen::setTableElement(jsi::Runtime &rt, jsi::Object instance, double index, jsi::Object value) {
        auto table = NativeStateHelper::tryGet<Table>(rt, instance);
        auto element = NativeStateHelper::tryGet<TableElement>(rt, value);
        table->setElement(index, element);
    }

    double ReactNativePolygen::getTableSize(jsi::Runtime &rt, jsi::Object instance) {
        auto table = NativeStateHelper::tryGet<Table>(rt, instance);
        return table->getSize();
    }

    jsi::Object ReactNativePolygen::buildModuleMetadata(jsi::Runtime &rt, const std::shared_ptr<Module> &mod) {
        auto imports = mod->getImports();
        auto exports = mod->getExports();

        std::vector<NativeImportDescriptor> importsMapped;
        std::vector<NativeExportDescriptor> exportsMapped;

        importsMapped.reserve(imports.size());
        exportsMapped.reserve(exports.size());

        for (auto &import_: imports) {
            importsMapped.push_back({import_.module, import_.name, static_cast<NativeSymbolKind>(import_.kind)});
        }

        for (auto &export_: exports) {
            exportsMapped.push_back({export_.name, static_cast<NativeSymbolKind>(export_.kind)});
        }

        NativeModuleMetadata result{importsMapped, exportsMapped};
        return bridging::toJs(rt, result, this->jsInvoker_);
    }
}
