file(GLOB_RECURSE wasmrt_headers CONFIGURE_DEPENDS *.h *.hpp)
file(GLOB_RECURSE wasmrt_sources CONFIGURE_DEPENDS *.cpp *.c *.cxx)

add_library(wasm-rt STATIC)
target_sources(wasm-rt
    PRIVATE
        ${wasmrt_sources}
        ${wasmrt_headers}

    PUBLIC
        FILE_SET HEADERS
        BASE_DIRS ..
        FILES ${wasmrt_headers}
)