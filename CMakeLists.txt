cmake_minimum_required(VERSION 3.16)
project(jpegdsp LANGUAGES CXX)

# ---------------------------------------------------------------------
# Global settings
# ---------------------------------------------------------------------
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

option(BUILD_TESTS "Build unit/integration tests" ON)
option(BUILD_EXAMPLES "Build example binaries" ON)

# ---------------------------------------------------------------------
# Core library
# ---------------------------------------------------------------------
add_library(jpegdsp_core
    src/core/Image.cpp
    src/core/ColorSpace.cpp
    src/core/Block.cpp
    src/core/Entropy.cpp
    src/core/Logging.cpp
    src/core/Downsampler.cpp

    src/transforms/DCTTransform.cpp

    src/jpeg/Quantization.cpp
    src/jpeg/ZigZag.cpp
    src/jpeg/RLE.cpp
    src/jpeg/Huffman.cpp
    src/jpeg/BlockEntropyEncoder.cpp
    src/jpeg/JPEGEncoder.cpp
    src/jpeg/JPEGWriter.cpp

    src/analysis/PipelineObserver.cpp

    src/util/FileIO.cpp
    src/util/BitWriter.cpp
    src/util/Timer.cpp
)

target_include_directories(jpegdsp_core
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# ---------------------------------------------------------------------
# CLI executables
# ---------------------------------------------------------------------
add_executable(jpegdsp_cli_encode src/cli/jpeg_encode_main.cpp)
target_link_libraries(jpegdsp_cli_encode PRIVATE jpegdsp_core)

add_executable(jpegdsp_dct_demo src/cli/dct_demo_main.cpp)
target_link_libraries(jpegdsp_dct_demo PRIVATE jpegdsp_core)

# ---------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------
if (BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()

# ---------------------------------------------------------------------
# Examples (optional)
# ---------------------------------------------------------------------
if (BUILD_EXAMPLES)
    add_executable(example_encode_basic examples/encode_basic.cpp)
    target_link_libraries(example_encode_basic PRIVATE jpegdsp_core)

    add_executable(example_visualize_dct examples/visualize_dct.cpp)
    target_link_libraries(example_visualize_dct PRIVATE jpegdsp_core)

    add_executable(example_entropy_compare examples/entropy_comparison.cpp)
    target_link_libraries(example_entropy_compare PRIVATE jpegdsp_core)
endif()

message(STATUS "jpegdsp project configured.")