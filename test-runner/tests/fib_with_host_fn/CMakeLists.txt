enable_testing()

add_executable(
        test_fib_with_host_fn
        Test.cpp
)
target_link_libraries(
        test_fib_with_host_fn
        GTest::gtest_main
)

polygen_module(test_fib_with_host_wasm PATH ${CMAKE_SOURCE_DIR})

include(GoogleTest)
gtest_discover_tests(test_fib_with_host_fn)