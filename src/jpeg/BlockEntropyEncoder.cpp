#include "jpegdsp/jpeg/BlockEntropyEncoder.hpp"
#include "jpegdsp/jpeg/ZigZag.hpp"
#include "jpegdsp/jpeg/RLE.hpp"
#include "jpegdsp/util/BitWriter.hpp"

namespace jpegdsp::jpeg {

BlockEntropyEncoder::BlockEntropyEncoder(const HuffmanEncoder& lumaEncoder,
                                         const HuffmanEncoder& chromaEncoder)
    : m_lumaEncoder(lumaEncoder), m_chromaEncoder(chromaEncoder)
{
}

std::int16_t BlockEntropyEncoder::encodeLumaBlock(
    const core::Block<std::int16_t, core::BlockSize>& block,
    std::int16_t prevDC,
    util::BitWriter& bw) const
{
    // Step 1: Extract DC coefficient
    std::int16_t dc = block.at(0, 0);
    std::int16_t dcDiff = dc - prevDC;

    // Step 2: Encode DC difference using Huffman
    m_lumaEncoder.encodeBlockDC(dcDiff, bw);

    // Step 3: Convert block to zig-zag order
    auto zz = ZigZag::toZigZag(block);

    // Step 4: RLE-encode AC coefficients (indices 1..63)
    auto rleSymbols = RLE::encodeAC(zz);

    // Step 5: Huffman-encode the AC symbols
    m_lumaEncoder.encodeBlockAC(rleSymbols, bw);

    // Step 6: Return current DC for next block's prediction
    return dc;
}

std::int16_t BlockEntropyEncoder::encodeChromaBlock(
    const core::Block<std::int16_t, core::BlockSize>& block,
    std::int16_t prevDC,
    util::BitWriter& bw) const
{
    // Step 1: Extract DC coefficient
    std::int16_t dc = block.at(0, 0);
    std::int16_t dcDiff = dc - prevDC;

    // Step 2: Encode DC difference using chroma Huffman tables
    m_chromaEncoder.encodeBlockDC(dcDiff, bw);

    // Step 3: Convert block to zig-zag order
    auto zz = ZigZag::toZigZag(block);

    // Step 4: RLE-encode AC coefficients (indices 1..63)
    auto rleSymbols = RLE::encodeAC(zz);

    // Step 5: Huffman-encode the AC symbols
    m_chromaEncoder.encodeBlockAC(rleSymbols, bw);

    // Step 6: Return current DC for next block's prediction
    return dc;
}

} // namespace jpegdsp::jpeg
