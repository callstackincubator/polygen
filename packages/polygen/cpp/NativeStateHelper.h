/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <jsi/jsi.h>

namespace callstack::polygen {

struct NativeStateHelper {
  /**
   * Wraps speciifed native state into `jsi::Object` and returns it.
   */
  template <typename T>
  static facebook::jsi::Object wrap(facebook::jsi::Runtime& rt, T&& state) {
    facebook::jsi::Object holder {rt};
    holder.setNativeState(rt, std::move(state));
    return holder;
  }

  /**
   * Attaches specified object to holder object, assuring that object has no state already attached.
   */
  template <typename T>
  static void attach(facebook::jsi::Runtime& rt, const facebook::jsi::Object& holder, const T& state) {
    assert(!holder.hasNativeState(rt));
    holder.setNativeState(rt, std::move(state));
  }

  template <typename T>
  static std::shared_ptr<T> tryGet(facebook::jsi::Runtime& rt, const facebook::jsi::Object& holder) {
    if (!holder.hasNativeState(rt)) {
      throw facebook::jsi::JSError(rt, "Argument passed is missing native state");
    }

    auto value = std::dynamic_pointer_cast<T>(holder.getNativeState(rt));
    if (value == nullptr) {
      throw facebook::jsi::JSError(rt, "Argument passed has native state of invalid type");
    }

    return value;
  }
};

}
