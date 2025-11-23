#include "jpegdsp/jpeg/JPEGWriter.hpp"

namespace jpegdsp::jpeg {

JPEGWriter::JPEGWriter(std::ostream& os)
    : m_os(os)
{}

void JPEGWriter::writeHeader(const JPEGEncoderConfig& cfg,
                             const JPEGQuantTable& qLuma,
                             const JPEGQuantTable& qChroma,
                             const HuffmanTable& dcLuma,
                             const HuffmanTable& acLuma,
                             const HuffmanTable& dcChroma,
                             const HuffmanTable& acChroma,
                             std::uint16_t width,
                             std::uint16_t height) {
    (void)cfg; (void)qLuma; (void)qChroma;
    (void)dcLuma; (void)acLuma; (void)dcChroma; (void)acChroma;
    (void)width; (void)height;
    // TODO: write JPEG markers and segments
}

void JPEGWriter::beginScan() {
    // TODO
}

void JPEGWriter::endScan() {
    // TODO
}

} // namespace jpegdsp::jpeg
