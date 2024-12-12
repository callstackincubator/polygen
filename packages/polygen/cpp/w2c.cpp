#include "w2c.h"
#include <cassert>
#include <bit>

using namespace callstack::polygen;

const uint8_t MAGIC_NUMBER[] = {'C', 'K', 'W', 'A', 'S', 'M'};

template<std::integral T>
constexpr T byteswap(T value) noexcept
{
    static_assert(std::has_unique_object_representations_v<T>,
                  "T may not have padding bits");
    auto value_representation = std::bit_cast<std::array<std::byte, sizeof(T)>>(value);
    std::ranges::reverse(value_representation);
    return std::bit_cast<T>(value_representation);
}


ModuleMetadataView* ModuleMetadataView::fromBuffer(std::span<uint8_t> moduleData) {
  assert(moduleData.size() >= sizeof(ModuleMetadataView));
  auto* view = ((ModuleMetadataView*)moduleData.data());
  
  if constexpr (std::endian::native == std::endian::big) {
    view->size = byteswap<uint64_t>(view->size);
    view->nameLength = byteswap<uint16_t>(view->nameLength);
  }
  return view;
}

bool ModuleMetadataView::isMetadata(std::span<uint8_t> moduleData) {
 return moduleData.size() >= 6 && memcmp(moduleData.data(), MAGIC_NUMBER, 6) == 0;
}

