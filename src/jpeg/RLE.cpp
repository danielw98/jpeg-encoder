#include "jpegdsp/jpeg/RLE.hpp"

namespace jpegdsp::jpeg {

std::vector<RLESymbol>
RLE::encodeAC(const std::array<std::int16_t,64>& zz) {
    (void)zz;
    std::vector<RLESymbol> out;
    // TODO
    return out;
}

} // namespace jpegdsp::jpeg
