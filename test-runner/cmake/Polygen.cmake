include(CMakeParseArguments)

function(polygen_module TARGET_NAME)
    cmake_parse_arguments(ARGS
        "" # Flags
        "PATH" # Single value arguments
        ""  # Multi value arguments
        ${ARGV}
    )

    if(NOT ARGS_PATH)
        message(FATAL_ERROR "You must provide a PATH")
    endif()

    set(OUTPUT_DIR "${CMAKE_BINARY_DIR}/polygen-codegen/${TARGET_NAME}")
    set(GENERATED_SOURCE_PATH "${OUTPUT_DIR}")

    add_custom_command(
        OUTPUT "${OUTPUT_DIR}"
        WORKING_DIRECTORY "${ARGS_PATH}"
        COMMAND npx ARGS polygen generate --output-dir "${OUTPUT_DIR}"
    )

    file(GLOB_RECURSE GENERATED_SOURCE_FILES "${GENERATED_SOURCE_PATH}/*.h" "${GENERATED_SOURCE_PATH}/*.cpp")
    message(GENERATED_SOURCE_PATH=${GENERATED_SOURCE_PATH})
    message(GENERATED_SOURCE_FILES=${GENERATED_SOURCE_FILES})
    add_library(${TARGET_NAME} STATIC ${GENERATED_SOURCE_FILES})
    target_include_directories(${TARGET_NAME} SYSTEM PRIVATE ${GENERATED_SOURCE_PATH})
    target_link_libraries(${TARGET_NAME} PRIVATE JSI polygen)
endfunction()