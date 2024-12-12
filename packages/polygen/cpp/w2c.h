#pragma once

#include <cinttypes>
#include <span>

namespace callstack::polygen {

struct __attribute__ ((packed)) ModuleMetadataView {
  char magic[6];
  uint8_t version;
  uint64_t size;
  uint8_t checksum[32];
private:
  // should use getName instead
  uint16_t nameLength;
  const char name[];
public:
  
  static ModuleMetadataView* fromBuffer(std::span<uint8_t> moduleData);
  static bool isMetadata(std::span<uint8_t> moduleData);
  
  const std::string_view getName() const {
    return { name, nameLength };
  }
};

}
