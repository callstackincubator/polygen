file(GLOB_RECURSE fakern_headers CONFIGURE_DEPENDS *.hpp *.h)
file(GLOB_RECURSE fakern_sources CONFIGURE_DEPENDS *.c *.cpp *.cxx)

add_library(fakern STATIC ${fakern_headers} ${fakern_sources}
        DummyRuntime.cpp)
target_sources(fakern PUBLIC FILE_SET HEADERS
    TYPE HEADERS
        BASE_DIRS "${fakern_SOURCE_BASE_DIR}"
    FILES ${fakern_headers}
)

target_include_directories(fakern PUBLIC SYSTEM .)
target_include_directories(fakern PUBLIC .)
target_link_libraries(fakern PUBLIC Hermes::Hermes Folly::folly)