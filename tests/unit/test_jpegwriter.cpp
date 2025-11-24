#include "jpegdsp/jpeg/JPEGWriter.hpp"
#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/core/Constants.hpp"
#include <iostream>
#include <vector>
#include <cstdlib>

using namespace jpegdsp::core;

namespace
{
    void runTest(const char* name, bool (*fn)(), int& total, int& failed)
    {
        total++;
        if (!fn())
        {
            failed++;
            std::cerr << "[FAIL] " << name << "\n";
        }
        else
        {
            std::cout << "[PASS] " << name << "\n";
        }
    }
}

bool test_jpegwriter_small_grayscale()
{
    const std::size_t w = 16;
    const std::size_t h = 16;
    Image img(w, h, ColorSpace::GRAY, 1);

    for (std::size_t y = 0; y < h; ++y)
    {
        for (std::size_t x = 0; x < w; ++x)
        {
            img.at(x, y, 0) = static_cast<Pixel8>((x + y) * 8);
        }
    }

    jpegdsp::jpeg::JPEGWriter writer;
    std::vector<std::uint8_t> jpegData;

    try
    {
        jpegData = writer.encodeGrayscale(img, 75);
    }
    catch (const std::exception& e)
    {
        std::cerr << "test_jpegwriter_small_grayscale: exception during encoding: "
                  << e.what() << "\n";
        return false;
    }

    if (jpegData.size() < 100)
    {
        std::cerr << "test_jpegwriter_small_grayscale: buffer too small: "
                  << jpegData.size() << " bytes\n";
        return false;
    }

    if (jpegData.size() < 2 || jpegData[0] != 0xFF || jpegData[1] != 0xD8)
    {
        std::cerr << "test_jpegwriter_small_grayscale: missing SOI marker\n";
        return false;
    }

    std::size_t sz = jpegData.size();
    if (sz < 2 || jpegData[sz - 2] != 0xFF || jpegData[sz - 1] != 0xD9)
    {
        std::cerr << "test_jpegwriter_small_grayscale: missing EOI marker\n";
        return false;
    }

    bool foundDQT = false;
    bool foundSOF0 = false;
    bool foundSOS = false;

    for (std::size_t i = 0; i < sz - 1; ++i)
    {
        if (jpegData[i] == 0xFF)
        {
            std::uint8_t marker = jpegData[i + 1];
            if (marker == 0xDB) foundDQT = true;
            if (marker == 0xC0) foundSOF0 = true;
            if (marker == 0xDA) foundSOS = true;
        }
    }

    if (!foundDQT)
    {
        std::cerr << "test_jpegwriter_small_grayscale: missing DQT marker\n";
        return false;
    }
    if (!foundSOF0)
    {
        std::cerr << "test_jpegwriter_small_grayscale: missing SOF0 marker\n";
        return false;
    }
    if (!foundSOS)
    {
        std::cerr << "test_jpegwriter_small_grayscale: missing SOS marker\n";
        return false;
    }

    return true;
}

int main()
{
    int total = 0;
    int failed = 0;

    runTest("jpegwriter_small_grayscale", &test_jpegwriter_small_grayscale, total, failed);

    std::cout << "----------------------------------------\n";
    std::cout << "JPEGWriter tests run:   " << total << "\n";
    std::cout << "JPEGWriter tests failed:" << failed << "\n";

    return (failed == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
}
