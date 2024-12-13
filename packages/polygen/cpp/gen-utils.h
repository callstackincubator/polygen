#pragma once
#include <cinttypes>

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
