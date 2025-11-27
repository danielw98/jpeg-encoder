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

add_executable(test_downsampler unit/test_downsampler.cpp)
target_link_libraries(test_downsampler PRIVATE jpegdsp_core)
add_test(NAME test_downsampler COMMAND $<TARGET_FILE:test_downsampler>)

add_executable(test_jpeg_padding unit/test_jpeg_padding.cpp)
target_link_libraries(test_jpeg_padding PRIVATE jpegdsp_core)
add_test(NAME test_jpeg_padding COMMAND $<TARGET_FILE:test_jpeg_padding>)

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

# Comprehensive pipeline diagnostic test
add_executable(test_jpeg_pipeline unit/test_jpeg_pipeline.cpp)
target_link_libraries(test_jpeg_pipeline PRIVATE jpegdsp_core)
add_test(NAME test_jpeg_pipeline COMMAND $<TARGET_FILE:test_jpeg_pipeline>)

# Single block encoding test
add_executable(test_single_block_encode unit/test_single_block_encode.cpp)
target_link_libraries(test_single_block_encode PRIVATE jpegdsp_core)
add_test(NAME test_single_block_encode COMMAND $<TARGET_FILE:test_single_block_encode>)

# DC-only encoding test
add_executable(test_dc_only unit/test_dc_only.cpp)
target_link_libraries(test_dc_only PRIVATE jpegdsp_core)

# Huffman DC debug test
add_executable(test_huffman_dc_debug unit/test_huffman_dc_debug.cpp)
target_link_libraries(test_huffman_dc_debug PRIVATE jpegdsp_core)

# Solid color test to isolate corruption bug
add_executable(test_solid_color unit/test_solid_color.cpp)
target_link_libraries(test_solid_color PRIVATE jpegdsp_core)
add_test(NAME test_solid_color COMMAND $<TARGET_FILE:test_solid_color>)

# MCU debug test to trace data flow
add_executable(test_mcu_debug unit/test_mcu_debug.cpp)
target_link_libraries(test_mcu_debug PRIVATE jpegdsp_core)
add_test(NAME test_mcu_debug COMMAND $<TARGET_FILE:test_mcu_debug>)

# Zigzag verification test
add_executable(test_zigzag_verify unit/test_zigzag_verify.cpp)
target_link_libraries(test_zigzag_verify PRIVATE jpegdsp_core)
add_test(NAME test_zigzag_verify COMMAND $<TARGET_FILE:test_zigzag_verify>)

# Solid red debug
add_executable(test_solid_red_debug unit/test_solid_red_debug.cpp)
target_link_libraries(test_solid_red_debug PRIVATE jpegdsp_core)

# Grayscale simple test
add_executable(test_grayscale_simple unit/test_grayscale_simple.cpp)
target_link_libraries(test_grayscale_simple PRIVATE jpegdsp_core)

# DQT zigzag order test (ITU-T.81 B.2.4.1)
add_executable(test_dqt_zigzag unit/test_dqt_zigzag.cpp)
target_link_libraries(test_dqt_zigzag PRIVATE jpegdsp_core)
add_test(NAME test_dqt_zigzag COMMAND $<TARGET_FILE:test_dqt_zigzag>)