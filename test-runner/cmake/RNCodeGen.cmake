include(CMakeParseArguments)

function(react_native_codegen TARGET_NAME)
    cmake_parse_arguments(ARGS
        "" # Flags
        "PATH" # Single value arguments
        ""  # Multi value arguments
        ${ARGV}
    )

    if(NOT ARGS_PATH)
        message(FATAL_ERROR "You must provide a PATH")
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

    set(OUTPUT_DIR "${CMAKE_BINARY_DIR}/rn-codegen")
    set(GENERATED_SOURCE_PATH "${OUTPUT_DIR}/build/generated/ios")

    add_custom_command(
        DEPENDS ${TARGET_NAME}
        OUTPUT "${OUTPUT_DIR}"
        WORKING_DIRECTORY "${ARGS_PATH}"
        COMMAND yarn ARGS run react-native codegen --outputPath "${OUTPUT_DIR}"
    )

    file(GLOB_RECURSE GENERATED_SOURCE_FILES "${GENERATED_SOURCE_PATH}/*.h" "${GENERATED_SOURCE_PATH}/*.cpp")
    target_include_directories(${TARGET_NAME} SYSTEM PRIVATE ${GENERATED_SOURCE_PATH})
    target_sources(${TARGET_NAME} PRIVATE ${GENERATED_SOURCE_FILES})
endfunction()

function(target_add_react_native_codegen TARGET_NAME)
    cmake_parse_arguments(ARGS
            "" # Flags
            "PATH" # Single value arguments
            ""  # Multi value arguments
            ${ARGV}
    )

    react_native_codegen(${TARGET_NAME} PATH "${ARGS_PATH}")
endfunction()