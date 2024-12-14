#include "bridge.h"

namespace callstack::polygen {

LoaderError::LoaderError(const std::string& what): std::runtime_error(what) {}

}
