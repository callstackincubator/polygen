/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <initializer_list>
#include <tuple>
#include <unordered_map>
#include <optional>
#include <vector>
#include <ReactNativePolygen/WebAssembly/Module.h>

namespace callstack::polygen {

using ModuleFactoryFunction = std::function<std::shared_ptr<Module>()>;

struct ModuleBagEntry {
  std::string name;
  std::string checksum;
  ModuleFactoryFunction factory;
};

class ModuleBag final {
public:
  ModuleBag(std::initializer_list<ModuleBagEntry> items) {
    moduleNames_.reserve(items.size());
    
    for (auto& item : items) {
      moduleNames_.push_back(item.name);
      entryMap_.insert({ item.name, item });
    }
  }
  
  const std::vector<std::string>& getModuleNames() const {
    return moduleNames_;
  }
  
  const ModuleBagEntry* getModule(const std::string& name) const {
    auto entry = entryMap_.find(name);
    
    if (entry == entryMap_.end()) {
      return nullptr;
    }
    
    return &entry->second;
  }
  
  const ModuleBagEntry* findByChecksum(const std::string& checksum) const {
    for (auto& entry : entryMap_) {
      if (entry.second.checksum == checksum) {
        return &entry.second;
      }
    }
    
    return nullptr;
  }
  
private:
  std::vector<std::string> moduleNames_;
  // We ensure that map is created on creation and not changed since
  // because of that we can return pointer to items and addresses
  // should not change
  std::unordered_map<std::string, ModuleBagEntry> entryMap_;
};

}
