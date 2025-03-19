vcpkg_from_github(
    OUT_SOURCE_PATH SOURCE_PATH
    REPO facebook/hermes
    REF 1d7433bf196d57d2e50ca02e7e48095140e8bab9
    SHA512 9b755182ef540be48b9cb6c54257a3e3477d288e758fc21b91516daf5444f3647b79587e0b3a41da712e1be4caf93f212abeaf8639d9506d4dadd99ac3547458
    HEAD_REF static_h
)

# Copy HermesConfig.cmake into packages dir.
#
# This allows us to use `find_package(Hermes CONFIG)`
#
# We do this because Hermes does not provide one after `install`
#
file(
    INSTALL "${CMAKE_CURRENT_LIST_DIR}/HermesConfig.cmake"
    DESTINATION "${CURRENT_PACKAGES_DIR}/share/hermes"
)

vcpkg_cmake_configure(
    SOURCE_PATH ${SOURCE_PATH}
    OPTIONS
        -DHERMES_ENABLE_TEST_SUITE=OFF
    # Tools seem to be required, otherwise library is not built
    #   -DHERMES_ENABLE_TOOLS=ON
)

vcpkg_cmake_build()

# Copy headers to package directory.
#
# We are not running `cmake --install`, so we need to do this manually.
# Even if we did, the output only contains tools.
file(COPY
    "${SOURCE_PATH}/public/hermes"
    "${SOURCE_PATH}/API/hermes"
    "${SOURCE_PATH}/API/jsi/jsi"
    DESTINATION "${CURRENT_PACKAGES_DIR}/include"
    FILES_MATCHING
        PATTERN "*.h"
)

# Private API
file(COPY "${SOURCE_PATH}/include"
    DESTINATION "${CURRENT_PACKAGES_DIR}/include/hermes-private"
    FILES_MATCHING
        PATTERN "*.h"
)

#
# Copy built libraries into package directory.
#
set(BUILD_DIR "${CURRENT_BUILDTREES_DIR}/${TARGET_TRIPLET}")

file(
    COPY "${BUILD_DIR}-rel/lib/libhermesvm${CMAKE_SHARED_LIBRARY_SUFFIX}"
    DESTINATION "${CURRENT_PACKAGES_DIR}/lib"
)
file(
    COPY "${BUILD_DIR}-dbg/lib/libhermesvm${CMAKE_SHARED_LIBRARY_SUFFIX}"
    DESTINATION "${CURRENT_PACKAGES_DIR}/debug/lib"
)

# Copy license file
#
# vcpkg is noisy if we don't.
vcpkg_install_copyright(FILE_LIST "${SOURCE_PATH}/LICENSE")