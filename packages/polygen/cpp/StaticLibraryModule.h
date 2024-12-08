#pragma once

#include "Module.h"

namespace callstack::polygen {

class StaticLibraryModule : public Module {
public:
  explicit StaticLibraryModule(const std::string& name) : Module(name) {}
  explicit StaticLibraryModule(std::string&& name) : Module(std::move(name)) {}
  ~StaticLibraryModule() {}

  StaticLibraryModule(StaticLibraryModule&& other) = default;
  StaticLibraryModule& operator=(StaticLibraryModule&& other) = default;

  StaticLibraryModule(const StaticLibraryModule& other) = delete;
  StaticLibraryModule& operator=(const StaticLibraryModule& other) = delete;
};

}
