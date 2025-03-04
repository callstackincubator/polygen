include(CMakeParseArguments)

function(polygen_module TARGET_NAME)
    cmake_parse_arguments(ARGS
        "" # Flags
        "MODULE" # Single value arguments
        ""  # Multi value arguments
        ${ARGV}
    )

    if(NOT ARGS_MODULE)
        message(FATAL_ERROR "You must provide a MODULE")
    endif()

    file(GLOB_RECURSE project_native_files
            CONFIGURE_DEPENDS
            ${ARGS_PATH}/*.h
            ${ARGS_PATH}/*.hxx
            ${ARGS_PATH}/*.hpp
            ${ARGS_PATH}/*.cpp
            ${ARGS_PATH}/*.cxx
            ${ARGS_PATH}/*.cxx
    )

    set(OUTPUT_DIR "${CMAKE_BINARY_DIR}/polygen-codegen")
    set(GENERATED_SOURCE_PATH "${OUTPUT_DIR}")
    message(GENERATED_SOURCE_PATH=${GENERATED_SOURCE_PATH})

    add_custom_command(
        OUTPUT "${OUTPUT_DIR}"
        WORKING_DIRECTORY "${ARGS_PATH}"
        COMMAND yarn ARGS run polygen generate ${ARGS_MODULE} --output-dir "${OUTPUT_DIR}"
    )

    file(GLOB_RECURSE GENERATED_SOURCE_FILES "${GENERATED_SOURCE_PATH}/*.h" "${GENERATED_SOURCE_PATH}/*.cpp")
    add_library(${TARGET_NAME} STATIC ${GENERATED_SOURCE_FILES})
    target_include_directories(${TARGET_NAME} SYSTEM PRIVATE ${GENERATED_SOURCE_PATH})
    target_link_libraries(${TARGET_NAME} PRIVATE JSI polygen)
endfunction()