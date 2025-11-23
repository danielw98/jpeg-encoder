#pragma once
#include <memory>
#include <vector>
#include "JPEGTypes.hpp"
#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/transforms/DCTTransform.hpp"
#include "Quantization.hpp"
#include "Huffman.hpp"

namespace jpegdsp::analysis { class PipelineObserver; }

namespace jpegdsp::jpeg {

class JPEGEncoder {
public:
    explicit JPEGEncoder(JPEGEncoderConfig cfg);

    void addObserver(std::shared_ptr<jpegdsp::analysis::PipelineObserver> obs);

    std::vector<std::uint8_t> encode(const jpegdsp::core::Image& rgbImage);

private:
    JPEGEncoderConfig m_cfg;
    std::unique_ptr<jpegdsp::transforms::ITransform2D<float,8>> m_transform;
    Quantizer m_quantizer;
    HuffmanTable m_dcLuma, m_acLuma, m_dcChroma, m_acChroma;

    std::vector<std::shared_ptr<jpegdsp::analysis::PipelineObserver>> m_observers;
};

} // namespace jpegdsp::jpeg
