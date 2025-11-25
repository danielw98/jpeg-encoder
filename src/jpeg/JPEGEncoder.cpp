#include "jpegdsp/jpeg/JPEGEncoder.hpp"
#include "jpegdsp/jpeg/JPEGWriter.hpp"
#include "jpegdsp/core/ImagePadding.hpp"
#include "jpegdsp/core/ColorSpace.hpp"
#include "jpegdsp/analysis/PipelineObserver.hpp"
#include <stdexcept>

namespace jpegdsp::jpeg {

JPEGEncoder::JPEGEncoder(JPEGEncoderConfig cfg)
    : m_cfg(cfg),
      m_transform(std::make_unique<jpegdsp::transforms::DCT8x8Transform>())
{
}

void JPEGEncoder::addObserver(std::shared_ptr<jpegdsp::analysis::PipelineObserver> obs) {
    m_observers.push_back(std::move(obs));
}

std::vector<std::uint8_t> JPEGEncoder::encode(const jpegdsp::core::Image& rgbImage) {
    using namespace core;
    
    // Validate input
    if (rgbImage.width() == 0 || rgbImage.height() == 0)
    {
        throw std::invalid_argument("JPEGEncoder::encode: Image dimensions cannot be zero");
    }
    
    // Use JPEGWriter for actual encoding
    JPEGWriter writer;
    std::vector<std::uint8_t> result;
    
    // Determine encoding path based on image format
    if (rgbImage.channels() == 1 && rgbImage.colorSpace() == ColorSpace::GRAY)
    {
        // Grayscale encoding
        Image padded = ImagePadding::padToMultiple(rgbImage, 8);
        result = writer.encodeGrayscale(padded, m_cfg.quality);
    }
    else if (rgbImage.channels() == 3 && rgbImage.colorSpace() == ColorSpace::RGB)
    {
        // Color encoding
        Image padded = ImagePadding::padToMultiple(rgbImage, 16);
        result = writer.encodeYCbCr(padded, m_cfg.quality);
    }
    else
    {
        throw std::invalid_argument("JPEGEncoder::encode: Unsupported image format. "
                                    "Expected grayscale (1 channel) or RGB (3 channels)");
    }
    
    return result;
}

} // namespace jpegdsp::jpeg
