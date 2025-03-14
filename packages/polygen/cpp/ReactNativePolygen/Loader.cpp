/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#include "Loader.h"
#include <fmt/format.h>
#include <ReactNativePolygen/w2c.h>

namespace callstack::polygen {

LoaderError::LoaderError(const std::string& what): std::runtime_error(what) {}

std::shared_ptr<Module> Loader::loadModule(std::span<uint8_t> moduleData) const {
  if (ModuleMetadataView::isMetadata(moduleData)) {
    auto metadata = ModuleMetadataView::fromBuffer(moduleData);
    
    return this->loadModuleByName(metadata->getName(), metadata->checksum);
  }
  else {
    return this->loadModuleFromContents(moduleData);
  }
}

std::shared_ptr<Module> Loader::loadModuleByName(const std::string& name, const std::string& checksum) const {
  auto* foundModule = registry_.getModule(name);
  
  if (foundModule == nullptr) {
    throw LoaderError {
      fmt::format("Failed to load WebAssembly Module '{}'. The module was not precompiled. Perhaps you forgot to run 'polygen generate'?", name)
    };
  }
  
  if (foundModule->checksum != checksum) {
    throw LoaderError {
      fmt::format("Module checksums for '{}' differ, this means that the precompiled module is different from the one that was generated. Perhaps you forgot to rebuild the project?", name)
    };
  }
  
  return foundModule->factory();
}


std::shared_ptr<Module> Loader::loadModuleFromContents(std::span<uint8_t> moduleData) const {
  auto checksum = computeSHA256(moduleData);
  if (auto foundModule = registry_.findByChecksum(checksum); foundModule != nullptr) {
    return foundModule->factory();
  }

  throw LoaderError { "Tried to load an unknown WebAssembly Module from binary buffer. Polygen can only load statically precompilied modules." };
}

}
