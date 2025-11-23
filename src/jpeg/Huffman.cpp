#include "jpegdsp/jpeg/Huffman.hpp"
#include "jpegdsp/util/BitWriter.hpp"

namespace jpegdsp::jpeg {

HuffmanTable::HuffmanTable() {
    // TODO: initialize with standard JPEG tables
}

const HuffmanCode& HuffmanTable::codeFor(std::uint8_t symbol) const {
    return m_codes[symbol];
}

HuffmanEncoder::HuffmanEncoder(const HuffmanTable& dcTable,
                               const HuffmanTable& acTable)
    : m_dcTable(dcTable), m_acTable(acTable)
{}

void HuffmanEncoder::encodeBlockDC(std::int16_t dcDiff, util::BitWriter& bw) const {
    (void)dcDiff;
    (void)bw;
    // TODO
}

void HuffmanEncoder::encodeBlockAC(const std::vector<RLESymbol>& acSymbols,
                                   util::BitWriter& bw) const {
    (void)acSymbols;
    (void)bw;
    // TODO
}

} // namespace jpegdsp::jpeg
