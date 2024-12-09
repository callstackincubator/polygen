#pragma once

#include <vector>
#include <span>
#include <cinttypes>

namespace callstack::polygen {

std::string computeSHA256(std::span<uint8_t> buffer);

};
