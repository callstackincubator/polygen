/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once
#include <cinttypes>
#include <type_traits>
#include <jsi/jsi.h>

#define INIT_IMPORT_CTX(field, importName) field{&rootCtx, rt, this->importObject.getPropertyAsObject(rt, importName)}

#define HOSTFN(name, argCount)         \
  jsi::Function::createFromHostFunction( \
    rt, \
    jsi::PropNameID::forAscii(rt, name), \
    argCount, \
    [=](jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) -> jsi::Value

typedef uint8_t u8;
typedef int8_t s8;
typedef uint16_t u16;
typedef int16_t s16;
typedef uint32_t u32;
typedef int32_t s32;
typedef uint64_t u64;
typedef int64_t s64;
typedef float f32;
typedef double f64;

namespace callstack::polygen {

template <typename T>
T coerceToNumber(const facebook::jsi::Value& value) {
  if (value.isUndefined() || value.isNull()) {
    return (T)0;
  }
  
  if (value.isBool()) {
    return (T)value.asBool();
  }
  
  return (T)value.asNumber();
}

};
