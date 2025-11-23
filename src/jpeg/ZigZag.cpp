#include "jpegdsp/jpeg/ZigZag.hpp"

namespace jpegdsp::jpeg {

std::array<std::int16_t, 64>
ZigZag::toZigZag(const jpegdsp::core::Block<std::int16_t,8>& block) {
    (void)block;
    std::array<std::int16_t, 64> out{};
    // TODO
    return out;
}

jpegdsp::core::Block<std::int16_t,8>
ZigZag::fromZigZag(const std::array<std::int16_t,64>& zz) {
    (void)zz;
    jpegdsp::core::Block<std::int16_t,8> block{};
    // TODO
    return block;
}

} // namespace jpegdsp::jpeg
