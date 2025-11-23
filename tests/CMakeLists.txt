add_executable(test_dct tests/unit/test_dct.cpp)
target_link_libraries(test_dct PRIVATE jpegdsp_core)
add_test(NAME test_dct COMMAND test_dct)

add_executable(test_entropy tests/unit/test_entropy.cpp)
target_link_libraries(test_entropy PRIVATE jpegdsp_core)
add_test(NAME test_entropy COMMAND test_entropy)

add_executable(test_jpeg_encoder tests/integration/test_jpeg_encoder.cpp)
target_link_libraries(test_jpeg_encoder PRIVATE jpegdsp_core)
add_test(NAME test_jpeg_encoder COMMAND test_jpeg_encoder)
