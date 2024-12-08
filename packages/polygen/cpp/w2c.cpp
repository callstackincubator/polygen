#include "w2c.h"
#include <cassert>

using namespace callstack::polygen;

const uint8_t MAGIC_NUMBER[] = {'C', 'K', 'W', 'A', 'S', 'M'};

ModuleMetadataView ModuleMetadataView::fromBuffer(std::span<uint8_t> moduleData) {
  assert(moduleData.size() >= sizeof(ModuleMetadataView));
  return *((ModuleMetadataView*)moduleData.data());
}

bool ModuleMetadataView::isMetadata(std::span<uint8_t> moduleData) {
 return moduleData.size() >= 6 && memcmp(moduleData.data(), MAGIC_NUMBER, 6) == 0;
}
