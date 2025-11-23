#pragma once
#include <array>
#include <cstdint>

namespace jpegdsp::jpeg {

struct JPEGQuantTable {
    std::array<std::uint16_t, 64> values{};
};

struct JPEGEncoderConfig {
    int quality = 75;
    bool subsampleChroma = true;
};

} // namespace jpegdsp::jpeg
