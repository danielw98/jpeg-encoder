#include "jpegdsp/transforms/DCTTransform.hpp"

namespace jpegdsp::transforms {

DCT8x8Transform::DCT8x8Transform() {
    // TODO: precompute cosines and alpha
}

void DCT8x8Transform::forward(const jpegdsp::core::Block<float,8>& in,
                              jpegdsp::core::Block<float,8>& out) const {
    (void)in;
    (void)out;
    // TODO
}

void DCT8x8Transform::inverse(const jpegdsp::core::Block<float,8>& in,
                              jpegdsp::core::Block<float,8>& out) const {
    (void)in;
    (void)out;
    // TODO
}

} // namespace jpegdsp::transforms
