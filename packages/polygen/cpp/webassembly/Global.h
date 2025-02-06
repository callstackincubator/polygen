/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <jsi/jsi.h>
#include <ReactNativePolygen/wasm-rt.h>

namespace callstack::polygen {

class Global: public facebook::jsi::NativeState {
  union Payload {
    uint32_t i32;
    int32_t u32;
    uint64_t i64;
    int64_t u64;
    float f32;
    double f64;
  };
public:
  enum class Type: uint32_t {
    I32 = 0,
    U32,
    I64,
    U64,
    F32,
    F64,
  };

  explicit Global(Type type, void* data, bool isMutable = false): type_(type), data_((Payload*)data), isMutable_(isMutable) {}
  explicit Global(Type type, facebook::jsi::Value value, bool isMutable = false): type_(type), isMutable_(isMutable), data_(&ownedData_) {
    setValueUnsafe(std::move(value));
  }

  facebook::jsi::Value getValue() {
    switch (type_) {
      case Type::I32:
        return { (double)data_->i32 };
      case Type::U32:
        return { (double)data_->u32 };
      case Type::I64:
        return { (double)data_->i64 };
      case Type::U64:
        return { (double)data_->u64 };
      case Type::F32:
        return { (double)data_->f32 };
      case Type::F64:
        return { (double)data_->f64 };
    }
  }

  void* getUnsafePayloadPtr() const {
    return this->data_;
  }

  void setValueUnsafe(facebook::jsi::Value newValue) {
    switch (type_) {
      case Type::I32:
        data_->i32 = newValue.asNumber();
        break;
      case Type::U32:
        data_->u32 = newValue.asNumber();
        break;
      case Type::I64:
        data_->i64 = newValue.asNumber();
        break;
      case Type::U64:
        data_->u64 = newValue.asNumber();
        break;
      case Type::F32:
        data_->f32 = newValue.asNumber();
        break;
      case Type::F64:
        data_->f64 = newValue.asNumber();
        break;
    }
  }

  void setValue(facebook::jsi::Runtime& rt, facebook::jsi::Value newValue) {
    if (!isMutable_) {
      throw facebook::jsi::JSError(rt, "Cannot change immutable WebAssembly.Global value");
    }

    setValueUnsafe(std::move(newValue));
  }

  bool isMutable() const {
    return isMutable_;
  }

  bool isOwned() const {
    return data_ == &ownedData_;
  }

private:
  bool isMutable_;
  Type type_;
  Payload* data_;
  Payload ownedData_;
};

}
