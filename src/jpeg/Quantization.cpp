#include "jpegdsp/jpeg/Quantization.hpp"
#include "jpegdsp/core/Constants.hpp"

#include <algorithm>
#include <cmath>
#include <stdexcept>

namespace jpegdsp::jpeg {

namespace
{
    using jpegdsp::core::BlockSize;
    using jpegdsp::core::BlockElementCount;

    // Standard JPEG quantization tables (quality 50) in natural row-major order

    constexpr std::uint16_t LumaBase[BlockElementCount] =
    {
        16, 11, 10, 16, 24, 40, 51, 61,
        12, 12, 14, 19, 26, 58, 60, 55,
        14, 13, 16, 24, 40, 57, 69, 56,
        14, 17, 22, 29, 51, 87, 80, 62,
        18, 22, 37, 56, 68,109,103, 77,
        24, 35, 55, 64, 81,104,113, 92,
        49, 64, 78, 87,103,121,120,101,
        72, 92, 95, 98,112,100,103, 99
    };

    constexpr std::uint16_t ChromaBase[BlockElementCount] =
    {
        17, 18, 24, 47, 99, 99, 99, 99,
        18, 21, 26, 66, 99, 99, 99, 99,
        24, 26, 56, 99, 99, 99, 99, 99,
        47, 66, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99
    };

    int clampInt(int v, int lo, int hi)
    {
        if (v < lo)
        {
            return lo;
        }
        if (v > hi)
        {
            return hi;
        }
        return v;
    }

    std::array<std::uint16_t, BlockElementCount> makeScaledTable(const std::uint16_t *base, int quality)
    {
        if (quality < 1)
        {
            quality = 1;
        }
        if (quality > 100)
        {
            quality = 100;
        }

        int scale = 0;

        if (quality < 50)
        {
            scale = 5000 / quality;
        }
        else
        {
            scale = 200 - 2 * quality;
        }

        std::array<std::uint16_t, BlockElementCount> result{};

        for (std::size_t i = 0; i < BlockElementCount; i++)
        {
            int baseVal = static_cast<int>(base[i]);
            int scaled = (baseVal * scale + 50) / 100; // rounded

            scaled = clampInt(scaled, 1, core::MAX_PIXEL_VALUE);
            result[i] = static_cast<std::uint16_t>(scaled);
        }

        return result;
    }
}

QuantTable::QuantTable()
    : m_values{}
{
}

QuantTable::QuantTable(const std::array<std::uint16_t, Size> &values)
    : m_values(values)
{
}

std::uint16_t QuantTable::at(std::size_t idx) const
{
    if (idx >= Size)
    {
        throw std::out_of_range("QuantTable::at");
    }

    return m_values[idx];
}

QuantTable QuantTable::makeLumaStd(int quality)
{
    auto arr = makeScaledTable(LumaBase, quality);
    return QuantTable(arr);
}

QuantTable QuantTable::makeChromaStd(int quality)
{
    auto arr = makeScaledTable(ChromaBase, quality);
    return QuantTable(arr);
}

void Quantizer::quantize(const jpegdsp::core::Block<float, BlockSize> &in,
                         const QuantTable &table,
                         jpegdsp::core::Block<std::int16_t, BlockSize> &out)
{
    for (std::size_t i = 0; i < BlockElementCount; i++)
    {
        float v = in.data[i];
        float q = static_cast<float>(table.at(i));

        float divided = 0.0f;

        if (q != 0.0f)
        {
            divided = v / q;
        }

        int rounded = static_cast<int>(std::floor(divided + 0.5f));

        out.data[i] = static_cast<std::int16_t>(rounded);
    }
}

void Quantizer::dequantize(const jpegdsp::core::Block<std::int16_t, BlockSize> &in,
                           const QuantTable &table,
                           jpegdsp::core::Block<float, BlockSize> &out)
{
    for (std::size_t i = 0; i < BlockElementCount; i++)
    {
        float coeff = static_cast<float>(in.data[i]);
        float q = static_cast<float>(table.at(i));

        out.data[i] = coeff * q;
    }
}

} // namespace jpegdsp::jpeg