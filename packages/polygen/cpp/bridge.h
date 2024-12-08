#pragma once

#include <memory>
#include <string>
#include <vector>
#include <jsi/jsi.h>
#include "Module.h"

namespace callstack::polygen::generated {

const std::vector<std::string>& getAvailableModules();
std::unique_ptr<callstack::polygen::Module> loadWebAssemblyModule(std::span<uint8_t> moduleData);

}
