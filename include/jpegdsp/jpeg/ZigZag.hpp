#pragma once
#include <array>
#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/Constants.hpp"

namespace jpegdsp::jpeg {

class ZigZag {
public:
    static std::array<std::int16_t, jpegdsp::core::BlockElementCount>
    toZigZag(const jpegdsp::core::Block<std::int16_t, jpegdsp::core::BlockSize>& block);

    static jpegdsp::core::Block<std::int16_t, jpegdsp::core::BlockSize>
    fromZigZag(const std::array<std::int16_t, jpegdsp::core::BlockElementCount>& zz);
};

} // namespace jpegdsp::jpeg
