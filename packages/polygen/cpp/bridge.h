#pragma once

#include <span>
#include <memory>
#include <string>
#include <vector>
#include "Module.h"

namespace callstack::polygen {

namespace generated {

/**
 * Returns a vector of available WebAssembly module names.
 *
 * Available modules are modules which were pre-compiled.
 */
const std::vector<std::string>& getAvailableModules();

/**
 * Loads specified WebAssembly module.
 *
 * Module data must either be either:
 *  - a binary WebAssembly module, that was pre-compiled and it's checksum matches one of available modules,
 *  - a mocked WebAssembly module metadata, that contains WebAssembly module name and its checksum.
 */
std::shared_ptr<callstack::polygen::Module> loadWebAssemblyModule(std::span<uint8_t> moduleData);

};

/**
 * Thrown when loading WebAssembly module failed for some reason.
 */
class LoaderError: public std::runtime_error {
public:
  explicit LoaderError(const std::string& what);
};
  
}
