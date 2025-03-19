/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <vector>
#include <span>
#include <cinttypes>

namespace callstack::polygen {

std::string computeSHA256(std::span<uint8_t> buffer);

};
