/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <jsi/jsi.h>
#include <wasm-rt/wasm-rt.h>

namespace callstack::polygen {

class Memory: public facebook::jsi::NativeState, public facebook::jsi::MutableBuffer {
public:
  explicit Memory(wasm_rt_memory_t* memory): memory_(memory) {}
  
  Memory(uint64_t initial, uint64_t maximum, bool is64 = false) {
    this->memory_ = &this->ownedMemory_;
    wasm_rt_allocate_memory(this->memory_, initial, maximum, is64);
  }
  
  virtual ~Memory() {
    if (this->isOwned()) {
      wasm_rt_free_memory(this->memory_);
    }
  }
  
  const wasm_rt_memory_t* getMemory() const {
    return this->memory_;
  }
  
  wasm_rt_memory_t* getMemory() {
    return this->memory_;
  }
  
  bool isOwned() const {
    return this->memory_ == &this->ownedMemory_;
  }
  
  void grow(uint64_t delta) const {
    wasm_rt_grow_memory(this->memory_, delta);
  }
  
  size_t size() const {
    return memory_->size;
  }
  
  uint8_t* data() {
    return memory_->data;
  }
  
private:
  wasm_rt_memory_t* memory_;
  wasm_rt_memory_t ownedMemory_;
};

}
