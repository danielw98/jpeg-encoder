# tests/CMakeLists.txt

add_executable(test_dct unit/test_dct.cpp)
target_link_libraries(test_dct PRIVATE jpegdsp_core)
add_test(NAME test_dct COMMAND $<TARGET_FILE:test_dct>)

add_executable(test_entropy unit/test_entropy.cpp)
target_link_libraries(test_entropy PRIVATE jpegdsp_core)
add_test(NAME test_entropy COMMAND $<TARGET_FILE:test_entropy>)

add_executable(test_jpeg_encoder integration/test_jpeg_encoder.cpp)
target_link_libraries(test_jpeg_encoder PRIVATE jpegdsp_core)
add_test(NAME test_jpeg_encoder COMMAND $<TARGET_FILE:test_jpeg_encoder>)