file(GLOB_RECURSE polygen_headers CONFIGURE_DEPENDS *.hpp *.h)
file(GLOB_RECURSE polygen_sources CONFIGURE_DEPENDS *.cpp *.c *.cxx)

add_library(polygen STATIC ${polygen_sources} ${polygen_headers})

target_link_libraries(polygen INTERFACE JSI)