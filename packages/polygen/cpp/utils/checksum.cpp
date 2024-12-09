#include "checksum.h"
#include "hashpp.h"

namespace callstack::polygen {

std::string computeSHA256(std::span<uint8_t> buffer) {
  auto hash = hashpp::get::getHash(hashpp::ALGORITHMS::SHA2_256, {(char*)buffer.data(), buffer.size()});
  return hash.getString();
}

}
