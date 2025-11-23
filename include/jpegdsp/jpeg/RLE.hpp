#pragma once
#include <cstdint>
#include <vector>
#include <array>

namespace jpegdsp::jpeg {

struct RLESymbol {
    std::uint8_t run;
    std::int16_t value;
};

class RLE {
public:
    static std::vector<RLESymbol>
    encodeAC(const std::array<std::int16_t,64>& zz);
};

} // namespace jpegdsp::jpeg
