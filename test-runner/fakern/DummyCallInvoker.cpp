//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

#include <utility>

#include "DummyCallInvoker.hpp"

namespace fakern {

void DummyCallInvoker::invokeAsync(facebook::react::CallFunc&& func) noexcept
{
    _runtime.runLater(std::move(func));
}

void DummyCallInvoker::invokeAsync(
    facebook::react::SchedulerPriority priority,
    facebook::react::CallFunc&& func
) noexcept
{
    // folly prio is reversed
    _runtime.runWithPriority(std::move(func), 5 - static_cast<int>(priority));
}

void DummyCallInvoker::invokeSync(facebook::react::CallFunc&& func)
{
    _runtime.runNowBlocking(std::move(func));
}

void DummyCallInvoker::invokeAsync(std::function<void()>&& function) noexcept
{
    _runtime.runLater([func = std::move(function)](auto& rt) mutable {
        func();
    });
}

void DummyCallInvoker::invokeSync(std::function<void()>&& function)
{
    _runtime.runNowBlocking([func = std::move(function)](auto& rt) mutable {
        func();
    });
}

}
