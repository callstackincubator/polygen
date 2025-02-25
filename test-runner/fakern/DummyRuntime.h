//
// Created by Robert Pasiński on 25/02/2025.
//
#pragma once
#include <folly/io/async/EventBase.h>
#include <folly/io/async/ScopedEventBaseThread.h>
#include <jsi/jsi.h>
#include <ReactCommon/CallInvoker.h>

namespace fakern {

class DummyRuntime {
  public:
    using Func = std::function<void(DummyRuntime&)>;

    explicit DummyRuntime(std::unique_ptr<facebook::jsi::Runtime>&& rt) noexcept;
    ~DummyRuntime() noexcept = default;

    void runLater(Func function);
    void runWithPriority(Func function, int32_t priority);
    void runAfter(Func function, std::chrono::milliseconds delay);
    void runNowBlocking(Func func);
    void runInBackground(Func func);

    facebook::jsi::Value executeScript(const std::string& script, const std::string& name);

    bool isRunning() const noexcept;
    void stop();

    operator facebook::jsi::Runtime&() const noexcept
    {
        return *_jsiRuntime;
    }

    auto callInvoker() const & -> facebook::react::CallInvoker&
    {
        return *_invoker;
    }

  private:
    folly::ScopedEventBaseThread _eventBaseThread;
    std::unique_ptr<facebook::react::CallInvoker> _invoker;
    std::unique_ptr<facebook::jsi::Runtime> _jsiRuntime;
};

}
