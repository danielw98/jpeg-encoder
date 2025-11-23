#include "jpegdsp/jpeg/Quantization.hpp"

namespace jpegdsp::jpeg {

Quantizer::Quantizer(const JPEGQuantTable& luma,
                     const JPEGQuantTable& chroma)
    : m_luma(luma), m_chroma(chroma)
{}

void Quantizer::scaleFromQuality(int quality) {
    (void)quality;
    // TODO
}

void Quantizer::quantize(const jpegdsp::core::Block<float,8>& in,
                         Component comp,
                         jpegdsp::core::Block<std::int16_t,8>& out) const {
    (void)in;
    (void)comp;
    (void)out;
    // TODO
}

void Quantizer::dequantize(const jpegdsp::core::Block<std::int16_t,8>& in,
                           Component comp,
                           jpegdsp::core::Block<float,8>& out) const {
    (void)in;
    (void)comp;
    (void)out;
    // TODO
}

} // namespace jpegdsp::jpeg
