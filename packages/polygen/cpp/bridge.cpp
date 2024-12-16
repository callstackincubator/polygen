/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#include "bridge.h"

namespace callstack::polygen {

LoaderError::LoaderError(const std::string& what): std::runtime_error(what) {}

}
