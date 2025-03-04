file(GLOB_RECURSE polygen_headers CONFIGURE_DEPENDS *.h *.hpp)
file(GLOB_RECURSE polygen_sources CONFIGURE_DEPENDS *.cpp *.c *.cxx)

add_library(polygen STATIC ${polygen_sources} ${polygen_headers})
target_sources(polygen
    PRIVATE
        ${polygen_sources}
        ${polygen_headers}

    PUBLIC
        FILE_SET HEADERS
        BASE_DIRS ..
        FILES ${polygen_headers}
)
#target_include_directories(polygen PUBLIC SYSTEM .)

# Check for test-runner
#if(DEFINED fakern)
target_link_libraries(polygen INTERFACE JSI)
target_link_libraries(polygen PUBLIC wasm-rt fakern)

get_target_property(polygen_SOURCE_DIR polygen SOURCE_DIR)
set(project_dir "${polygen_SOURCE_DIR}/../..")
target_add_react_native_codegen(polygen PATH "${project_dir}")
#endif()