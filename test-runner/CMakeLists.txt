cmake_minimum_required(VERSION 3.30)
project(polygen_test_runner C CXX)

list(APPEND CMAKE_MODULE_PATH ${CMAKE_SOURCE_DIR}/cmake)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

#find_package(GTest CONFIG REQUIRED)
find_package(Hermes CONFIG REQUIRED)
find_package(folly REQUIRED)

add_subdirectory(../packages/polygen/cpp polygen)
add_subdirectory(fakern)
add_subdirectory(shell)
