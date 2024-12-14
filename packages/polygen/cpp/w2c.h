#pragma once

#include <cinttypes>
#include <span>

namespace callstack::polygen {

/**
 * Represents WebAssembly Module metadata that is provided by bundler support.
 */
struct __attribute__ ((packed)) ModuleMetadataView {
  /**
   * Magic number that verifies the buffer contains metadata rather than Module binary contents.
   */
  char magic[6];
  
  /**
   * Metadata version
   */
  uint8_t version;
  
  /**
   * SHA-256 checksum of the module contents, null terminated.
   */
  char checksum[65];
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
