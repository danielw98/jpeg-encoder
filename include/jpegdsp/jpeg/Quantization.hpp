#pragma once
#include "JPEGTypes.hpp"
#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/Types.hpp"

namespace jpegdsp::jpeg {

class Quantizer {
public:
    Quantizer(const JPEGQuantTable& luma,
              const JPEGQuantTable& chroma);

    void scaleFromQuality(int quality);

    void quantize(const jpegdsp::core::Block<float,8>& in,
                  Component comp,
                  jpegdsp::core::Block<std::int16_t,8>& out) const;

    void dequantize(const jpegdsp::core::Block<std::int16_t,8>& in,
                    Component comp,
                    jpegdsp::core::Block<float,8>& out) const;

private:
    JPEGQuantTable m_luma;
    JPEGQuantTable m_chroma;
};

} // namespace jpegdsp::jpeg
