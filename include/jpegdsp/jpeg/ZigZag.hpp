#pragma once
#include <array>
#include "jpegdsp/core/Block.hpp"

namespace jpegdsp::jpeg {

class ZigZag {
public:
    static std::array<std::int16_t, 64>
    toZigZag(const jpegdsp::core::Block<std::int16_t,8>& block);

    static jpegdsp::core::Block<std::int16_t,8>
    fromZigZag(const std::array<std::int16_t,64>& zz);
};

} // namespace jpegdsp::jpeg
