#pragma once

#include <cinttypes>
#include <span>

namespace callstack::polygen {

struct ModuleMetadataView {
  char magic[6];
  uint64_t size;
  uint8_t checksum[32];
  const char name[1];
  
  static ModuleMetadataView fromBuffer(std::span<uint8_t> moduleData);
  static bool isMetadata(std::span<uint8_t> moduleData);
};

}
