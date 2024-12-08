#pragma once

#include <jsi/jsi.h>
#include <ReactNativePolygen/wasm-rt.h>

namespace callstack::polygen {

class Table: public facebook::jsi::NativeState {
public:
  const size_t DEFAULT_MAX_SIZE = 512;
  
  enum class Kind: uint32_t {
    FuncRef = 0,
    ExternRef,
  };
  
  virtual bool isOwned() const = 0;
  virtual Kind getKind() const = 0;
  virtual size_t getSize() const = 0;
  virtual size_t getCapacity() const = 0;
  virtual void grow(ptrdiff_t delta) = 0;
};

}
