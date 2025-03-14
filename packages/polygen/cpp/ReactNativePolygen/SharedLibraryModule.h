/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include "Module.h"
#include <dlfcn.h>

namespace facebook::react {

class SharedLibraryModule : public Module {
public:
  SharedLibraryModule(
    const std::string& name,
    std::vector<Import>&& imports,
    std::vector<Export>&& exports,,
    Factory&& factory
    void* handle
  ) : Module(name, std::move(imports), std::move(exports), std::move(factory)), ptr_(handle) {}
  SharedLibraryModule(
    std::string&& name,
    std::vector<Import>&& imports,
    std::vector<Export>&& exports,,
    Factory&& factory
    void* handle
  ) : Module(std::move(name), std::move(imports), std::move(exports), std::move(factory)), ptr_(handle) {}
  ~StaticLibraryModule() {}
  
  ~SharedLibraryModule() {
    dlclose(this->ptr_);
    this->ptr_ = nullptr;
  }

  SharedLibraryModule(SharedLibraryModule&& other) = default;
  SharedLibraryModule& operator=(SharedLibraryModule&& other) = default;

  SharedLibraryModule(const SharedLibraryModule& other) = delete;
  SharedLibraryModule& operator=(const SharedLibraryModule& other) = delete;

  template <typename T>
  T get(const char* name) {
    return (T)dlsym(ptr_, name);
  }

  static SharedLibraryModule&& load(const char* name, int mode) {
    return SharedLibraryModule { name, dlopen(name, mode) };
  }

private:
  void* ptr_;
};

}
