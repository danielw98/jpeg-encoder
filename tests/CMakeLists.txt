# tests/CMakeLists.txt

# Modular unit tests
add_executable(test_block unit/test_block.cpp)
target_link_libraries(test_block PRIVATE jpegdsp_core)
add_test(NAME test_block COMMAND $<TARGET_FILE:test_block>)

add_executable(test_dct unit/test_dct.cpp)
target_link_libraries(test_dct PRIVATE jpegdsp_core)
add_test(NAME test_dct COMMAND $<TARGET_FILE:test_dct>)

add_executable(test_colorspace unit/test_colorspace.cpp)
target_link_libraries(test_colorspace PRIVATE jpegdsp_core)
add_test(NAME test_colorspace COMMAND $<TARGET_FILE:test_colorspace>)

add_executable(test_quantization unit/test_quantization.cpp)
target_link_libraries(test_quantization PRIVATE jpegdsp_core)
add_test(NAME test_quantization COMMAND $<TARGET_FILE:test_quantization>)

add_executable(test_jpegwriter unit/test_jpegwriter.cpp)
target_link_libraries(test_jpegwriter PRIVATE jpegdsp_core)
add_test(NAME test_jpegwriter COMMAND $<TARGET_FILE:test_jpegwriter>)

# Comprehensive codec test (legacy - combines multiple modules)
add_executable(test_core_codec unit/test_core_codec.cpp)
target_link_libraries(test_core_codec PRIVATE jpegdsp_core)
add_test(NAME test_core_codec COMMAND $<TARGET_FILE:test_core_codec>)

add_executable(test_entropy unit/test_entropy.cpp)
target_link_libraries(test_entropy PRIVATE jpegdsp_core)
add_test(NAME test_entropy COMMAND $<TARGET_FILE:test_entropy>)

add_executable(test_jpeg_encoder integration/test_jpeg_encoder.cpp)
target_link_libraries(test_jpeg_encoder PRIVATE jpegdsp_core)
add_test(NAME test_jpeg_encoder COMMAND $<TARGET_FILE:test_jpeg_encoder>)