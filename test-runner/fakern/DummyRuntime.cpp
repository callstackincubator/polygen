//
// Created by Robert Pasiński on 25/02/2025.
//
#include <memory>
#include <utility>

#include "DummyRuntime.h"
#include "DummyCallInvoker.hpp"

namespace fakern {

DummyRuntime::DummyRuntime(std::unique_ptr<facebook::jsi::Runtime>&& rt) noexcept : _jsiRuntime(std::move(rt))
{
    _invoker = std::make_unique<DummyCallInvoker>(*this);
}

void DummyRuntime::runLater(Func function)
{
    _eventBaseThread.add([func = std::move(function), this]() mutable {
        func(*this);
    });
}

void DummyRuntime::runWithPriority(Func function, int32_t priority)
{
    _eventBaseThread.addWithPriority([func = std::move(function), this]() mutable {
        func(*this);
    }, priority);
}

void DummyRuntime::runAfter(Func function, std::chrono::milliseconds delay)
{
    _eventBaseThread.getEventBase()->runAfterDelay([func = std::move(function), this]() mutable {
        func(*this);
    }, delay.count());
}

void DummyRuntime::runNowBlocking(Func func)
{
    folly::Baton<> ready;
    if (_eventBaseThread.getEventBase()->isInEventBaseThread()) {
        func(*this);
    }
    else {
        _eventBaseThread.getEventBase()->runInEventBaseThread([&ready, func = std::move(func), this]() mutable {
            SCOPE_EXIT
            {
                ready.post();
            };
            folly::copy(std::move(func))(*this);
        });
    }

    ready.wait();
}

void DummyRuntime::runInBackground(Func function)
{
    _eventBaseThread.getEventBase()->add([func = std::move(function), this]() mutable {
        func(*this);
    });
}

facebook::jsi::Value DummyRuntime::executeScript(const std::string& script, const std::string& name)
{
    return _jsiRuntime->evaluateJavaScript(std::make_unique<facebook::jsi::StringBuffer>(script), name);
}

bool DummyRuntime::isRunning() const noexcept
{
    return _eventBaseThread.getEventBase()->isRunning();
}

void DummyRuntime::stop()
{
    return _eventBaseThread.getEventBase()->terminateLoopSoon();
}
}
