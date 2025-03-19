//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

#pragma once
#include <DummyRuntime.h>
#include <ReactCommon/CallInvoker.h>

namespace fakern {

class DummyCallInvoker final: public facebook::react::CallInvoker {
public:
    DummyCallInvoker(DummyRuntime& runtime) noexcept: _runtime(runtime) {}
    ~DummyCallInvoker() noexcept override = default;

    DummyCallInvoker(const DummyCallInvoker&) = delete;
    DummyCallInvoker& operator=(const DummyCallInvoker&) = delete;

    DummyCallInvoker(DummyCallInvoker&&) = delete;
    DummyCallInvoker& operator=(DummyCallInvoker&&) = delete;

    void invokeAsync(facebook::react::CallFunc&& func) noexcept override;

    void invokeAsync(facebook::react::SchedulerPriority priority, facebook::react::CallFunc&& func) noexcept override;
    void invokeSync(facebook::react::CallFunc&& func) override;
    void invokeAsync(std::function<void()>&& func) noexcept override;
    void invokeSync(std::function<void()>&& func) override;

  private:
    DummyRuntime& _runtime;
};

}