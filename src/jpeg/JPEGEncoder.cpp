#include "jpegdsp/jpeg/JPEGEncoder.hpp"
#include "jpegdsp/analysis/PipelineObserver.hpp"

namespace jpegdsp::jpeg {

JPEGEncoder::JPEGEncoder(JPEGEncoderConfig cfg)
    : m_cfg(cfg),
      m_transform(std::make_unique<jpegdsp::transforms::DCT8x8Transform>()),
      m_quantizer(JPEGQuantTable{}, JPEGQuantTable{})
{}

void JPEGEncoder::addObserver(std::shared_ptr<jpegdsp::analysis::PipelineObserver> obs) {
    m_observers.push_back(std::move(obs));
}

std::vector<std::uint8_t> JPEGEncoder::encode(const jpegdsp::core::Image& rgbImage) {
    (void)rgbImage;
    std::vector<std::uint8_t> out;
    // TODO: full JPEG pipeline
    return out;
}

} // namespace jpegdsp::jpeg
