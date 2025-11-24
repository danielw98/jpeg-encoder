#pragma once

#include <array>
#include <cstddef>
#include <cstdint>
#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/Constants.hpp"

namespace jpegdsp::jpeg {

class QuantTable {
public:
    static constexpr std::size_t Size = jpegdsp::core::BlockElementCount;

    QuantTable();

    explicit QuantTable(const std::array<std::uint16_t, Size> &values);

    const std::uint16_t *data() const noexcept
    {
        return m_values.data();
    }

    std::uint16_t at(std::size_t idx) const;

    // Standard JPEG-like tables, scaled by quality in [1,100]
    static QuantTable makeLumaStd(int quality);
    static QuantTable makeChromaStd(int quality);

private:
    std::array<std::uint16_t, Size> m_values{};
};

class Quantizer
{
public:
    static void quantize(const jpegdsp::core::Block<float, jpegdsp::core::BlockSize> &in,
                         const QuantTable &table,
                         jpegdsp::core::Block<std::int16_t, jpegdsp::core::BlockSize> &out);

    static void dequantize(const jpegdsp::core::Block<std::int16_t, jpegdsp::core::BlockSize> &in,
                           const QuantTable &table,
                           jpegdsp::core::Block<float, jpegdsp::core::BlockSize> &out);
};

} // namespace jpegdsp::jpeg
