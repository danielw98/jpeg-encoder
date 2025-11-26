cmake_minimum_required(VERSION 3.16)
project(jpegdsp LANGUAGES CXX)

# ---------------------------------------------------------------------
# Global settings
# ---------------------------------------------------------------------
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

option(BUILD_TESTS "Build unit/integration tests" ON)
option(BUILD_EXAMPLES "Build example binaries" ON)
option(JPEGDSP_USE_OPENCV "Enable OpenCV for advanced image I/O and processing" OFF)

# ---------------------------------------------------------------------
# External dependencies
# ---------------------------------------------------------------------
include(FetchContent)

# nlohmann::json for JSON serialization (header-only)
FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.3
)
FetchContent_MakeAvailable(json)

# OpenCV (optional) - for advanced image I/O and future image processing features
if(JPEGDSP_USE_OPENCV)
    find_package(OpenCV QUIET COMPONENTS core imgcodecs imgproc)
    if(OpenCV_FOUND)
        message(STATUS "OpenCV found: ${OpenCV_VERSION}")
        message(STATUS "  OpenCV_INCLUDE_DIRS: ${OpenCV_INCLUDE_DIRS}")
        message(STATUS "  OpenCV_LIBS: ${OpenCV_LIBS}")
        add_compile_definitions(JPEGDSP_USE_OPENCV)
    else()
        message(WARNING "OpenCV requested but not found. Install with: vcpkg install opencv")
        message(WARNING "Falling back to stb_image for image loading.")
    endif()
endif()

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
    src/core/ImagePadding.cpp

    src/transforms/DCTTransform.cpp

    src/jpeg/Quantization.cpp
    src/jpeg/ZigZag.cpp
    src/jpeg/RLE.cpp
    src/jpeg/Huffman.cpp
    src/jpeg/BlockEntropyEncoder.cpp
    src/jpeg/JPEGEncoder.cpp
    src/jpeg/JPEGWriter.cpp

    src/analysis/PipelineObserver.cpp
    src/analysis/JPEGAnalyzer.cpp

    src/api/JPEGEncoder.cpp

    src/util/FileIO.cpp
    src/util/BitWriter.cpp
    src/util/Timer.cpp
)

target_include_directories(jpegdsp_core
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
        ${CMAKE_CURRENT_SOURCE_DIR}/external
)

target_link_libraries(jpegdsp_core
    PUBLIC
        nlohmann_json::nlohmann_json
)

# Link OpenCV if available
if(JPEGDSP_USE_OPENCV AND OpenCV_FOUND)
    target_include_directories(jpegdsp_core PUBLIC ${OpenCV_INCLUDE_DIRS})
    target_link_libraries(jpegdsp_core PUBLIC ${OpenCV_LIBS})
endif()

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
    
    add_executable(example_api_demo examples/api_demo.cpp)
    target_link_libraries(example_api_demo PRIVATE jpegdsp_core)
endif()

message(STATUS "jpegdsp project configured.")