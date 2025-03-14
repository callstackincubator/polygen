/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <span>
#include <string>
#include <vector>
#include <wasm-rt.h>
#include <ReactNativePolygen/ModuleBag.h>

namespace callstack::polygen {

namespace generated {

const ModuleBag& getModuleBag();

};

/**
 * Thrown when WebAssembly module evaluation traps.
 */
class TrapError: public std::runtime_error {
public:
  wasm_rt_trap_t type;
  explicit TrapError(wasm_rt_trap_t type);
};

extern "C"
[[noreturn]]
void polygen_trap_handler(wasm_rt_trap_t trap);

}

