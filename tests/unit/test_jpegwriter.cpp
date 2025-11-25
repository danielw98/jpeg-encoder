#include "jpegdsp/jpeg/JPEGWriter.hpp"
#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/core/Constants.hpp"
#include "../TestFramework.hpp"
#include <iostream>
#include <vector>
#include <cstdlib>

using namespace jpegdsp::core;
using namespace jpegdsp::test;

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

bool test_jpegwriter_small_color()
{
    const std::size_t w = 16;
    const std::size_t h = 16;
    Image img(w, h, ColorSpace::RGB, 3);

    // Create simple RGB gradient pattern
    for (std::size_t y = 0; y < h; ++y)
    {
        for (std::size_t x = 0; x < w; ++x)
        {
            img.at(x, y, 0) = static_cast<Pixel8>((x * 15) & 0xFF);      // R
            img.at(x, y, 1) = static_cast<Pixel8>((y * 15) & 0xFF);      // G
            img.at(x, y, 2) = static_cast<Pixel8>(((x + y) * 8) & 0xFF); // B
        }
    }

    jpegdsp::jpeg::JPEGWriter writer;
    std::vector<std::uint8_t> jpegData;

    try
    {
        jpegData = writer.encodeYCbCr(img, 75);
    }
    catch (const std::exception& e)
    {
        std::cerr << "test_jpegwriter_small_color: exception during encoding: "
                  << e.what() << "\n";
        return false;
    }

    if (jpegData.size() < 200)
    {
        std::cerr << "test_jpegwriter_small_color: buffer too small: "
                  << jpegData.size() << " bytes\n";
        return false;
    }

    // Verify SOI marker
    if (jpegData.size() < 2 || jpegData[0] != 0xFF || jpegData[1] != 0xD8)
    {
        std::cerr << "test_jpegwriter_small_color: missing SOI marker\n";
        return false;
    }

    // Verify EOI marker
    std::size_t sz = jpegData.size();
    if (sz < 2 || jpegData[sz - 2] != 0xFF || jpegData[sz - 1] != 0xD9)
    {
        std::cerr << "test_jpegwriter_small_color: missing EOI marker\n";
        return false;
    }

    // Verify presence of key markers
    bool foundDQT = false;
    bool foundSOF0 = false;
    bool foundDHT = false;
    bool foundSOS = false;
    int dqtCount = 0;
    int dhtCount = 0;

    for (std::size_t i = 0; i < sz - 1; ++i)
    {
        if (jpegData[i] == 0xFF)
        {
            std::uint8_t marker = jpegData[i + 1];
            if (marker == 0xDB)
            {
                foundDQT = true;
                dqtCount++;
            }
            if (marker == 0xC0) foundSOF0 = true;
            if (marker == 0xC4)
            {
                foundDHT = true;
                dhtCount++;
            }
            if (marker == 0xDA) foundSOS = true;
        }
    }

    if (!foundDQT)
    {
        std::cerr << "test_jpegwriter_small_color: missing DQT marker\n";
        return false;
    }
    if (dqtCount < 2)
    {
        std::cerr << "test_jpegwriter_small_color: expected 2 DQT tables (luma + chroma), found "
                  << dqtCount << "\n";
        return false;
    }
    if (!foundSOF0)
    {
        std::cerr << "test_jpegwriter_small_color: missing SOF0 marker\n";
        return false;
    }
    if (!foundDHT)
    {
        std::cerr << "test_jpegwriter_small_color: missing DHT marker\n";
        return false;
    }
    if (dhtCount < 4)
    {
        std::cerr << "test_jpegwriter_small_color: expected 4 DHT tables (DC/AC luma + DC/AC chroma), found "
                  << dhtCount << "\n";
        return false;
    }
    if (!foundSOS)
    {
        std::cerr << "test_jpegwriter_small_color: missing SOS marker\n";
        return false;
    }

    return true;
}

int main()
{
    TestStats stats;

    runTest("jpegwriter_small_grayscale", &test_jpegwriter_small_grayscale, stats);
    runTest("jpegwriter_small_color", &test_jpegwriter_small_color, stats);

    stats.printSummary("JPEGWriter tests");
    return stats.exitCode();
}
