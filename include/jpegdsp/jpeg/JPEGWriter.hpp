#pragma once
#include <cstdint>
#include <ostream>
#include "JPEGTypes.hpp"
#include "Huffman.hpp"

namespace jpegdsp::jpeg {

class JPEGWriter {
public:
    explicit JPEGWriter(std::ostream& os);

    void writeHeader(const JPEGEncoderConfig& cfg,
                     const JPEGQuantTable& qLuma,
                     const JPEGQuantTable& qChroma,
                     const HuffmanTable& dcLuma,
                     const HuffmanTable& acLuma,
                     const HuffmanTable& dcChroma,
                     const HuffmanTable& acChroma,
                     std::uint16_t width,
                     std::uint16_t height);

    void beginScan();
    void endScan();

private:
    std::ostream& m_os;
};

} // namespace jpegdsp::jpeg
