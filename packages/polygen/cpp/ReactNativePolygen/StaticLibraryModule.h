/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include "Module.h"

namespace callstack::polygen {

class StaticLibraryModule : public Module {
public:
  StaticLibraryModule(
    const std::string& name,
    std::vector<Import>&& imports,
    std::vector<Export>&& exports,
    Factory&& factory
  ) : Module(name, std::move(imports), std::move(exports), std::move(factory)) {}
  StaticLibraryModule(
    std::string&& name,
    std::vector<Import>&& imports,
    std::vector<Export>&& exports,
    Factory&& factory
  ) : Module(std::move(name), std::move(imports), std::move(exports), std::move(factory)) {}
  ~StaticLibraryModule() {}

  StaticLibraryModule(StaticLibraryModule&& other) = default;
  StaticLibraryModule& operator=(StaticLibraryModule&& other) = default;

  StaticLibraryModule(const StaticLibraryModule& other) = delete;
  StaticLibraryModule& operator=(const StaticLibraryModule& other) = delete;
};

}
