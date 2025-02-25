#include <iostream>
#include <fmt/format.h>

#include <hermes/hermes.h>
#include <jsi/jsi.h>
#include <DummyRuntime.h>
#include <DummyCallInvoker.hpp>

using namespace fakern;
using namespace facebook;

void run(DummyRuntime& rt, react::CallInvoker& invoker) {
    // auto polygenTurboModule = std::make_shared<facebook::react::ReactNativePolygen>(invoker);
    //
    // // Expose TurboModule as `globalThis.Polygen` (instead of TurboModule.get)
    // auto polygenObject = jsi::Object::createFromHostObject(env, polygenTurboModule);
    // env.globalObject().setProperty(env, "Polygen", std::move(polygenObject));
    //
    // env.evaluateScript("print(typeof Polygen);");
    // env.evaluateScript("print(Object.keys(Polygen));");
}

int main() {
    auto hermesConfig = ::hermes::vm::RuntimeConfig::Builder()
                   .withMicrotaskQueue(true)
                   .withIntl(false)
                   .build();

    auto runtime = std::make_unique<DummyRuntime>(facebook::hermes::makeHermesRuntime(hermesConfig));

    // Execute some JS.
    int status = 0;
    try {
        runtime->executeScript("print('hello!')", "<eval>");
        // run(rt, env);
    } catch (jsi::JSError &e) {
        // Handle JS exceptions here.
        std::cerr << "JS Exception: " << e.getStack() << std::endl;
        status = 1;
    }
    catch (jsi::JSIException &e) {
        // Handle JSI exceptions here.
        std::cerr << "JSI Exception: " << e.what() << std::endl;
        status = 1;
    }

    return status;
}
