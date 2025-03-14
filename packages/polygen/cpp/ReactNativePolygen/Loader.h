/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <ReactNativePolygen/utils/checksum.h>
#include <ReactNativePolygen/ModuleBag.h>

namespace callstack::polygen {

/**
 * Thrown when loading WebAssembly module failed for some reason.
 */
class LoaderError: public std::runtime_error {
public:
  explicit LoaderError(const std::string& what);
};

class Loader final {
public:
  Loader(const ModuleBag& registry): registry_(registry) {}
  
  std::shared_ptr<Module> loadModule(std::span<uint8_t> moduleData) const;
  std::shared_ptr<Module> loadModuleByName(const std::string& name, const std::string& checksum) const;
  std::shared_ptr<Module> loadModuleFromContents(std::span<uint8_t> moduleData) const;
  
private:
  const ModuleBag& registry_;
};

}
