/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#include "bridge.h"

namespace callstack::polygen {

TrapError::TrapError(wasm_rt_trap_t type): std::runtime_error(wasm_rt_strerror(type)), type(type) {}

void polygen_trap_handler(wasm_rt_trap_t trap) {
  throw TrapError(trap);
}

}
