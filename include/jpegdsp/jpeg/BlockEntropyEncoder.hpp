#pragma once
#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/Constants.hpp"
#include "jpegdsp/jpeg/Huffman.hpp"
#include <cstdint>

namespace jpegdsp {
namespace util { class BitWriter; }
}

namespace jpegdsp::jpeg {

/**
 * BlockEntropyEncoder encapsulates the entropy coding tail for a single 8×8 block:
 * - ZigZag ordering
 * - RLE encoding of AC coefficients
 * - Huffman encoding via HuffmanEncoder
 * - DC prediction
 */
class BlockEntropyEncoder
{
public:
    BlockEntropyEncoder(const HuffmanEncoder& lumaEncoder,
                        const HuffmanEncoder& chromaEncoder);

    /**
     * Encodes a single luma block using DC prediction and entropy coding.
     * 
     * @param block The quantized 8×8 block in normal order
     * @param prevDC The previous DC coefficient for prediction
     * @param bw The BitWriter to write encoded bits to
     * @return The current DC coefficient (to be used as prevDC for next block)
     */
    std::int16_t encodeLumaBlock(const core::Block<std::int16_t, core::BlockSize>& block,
                                 std::int16_t prevDC,
                                 util::BitWriter& bw) const;

    /**
     * Encodes a single chroma block using DC prediction and entropy coding.
     * 
     * @param block The quantized 8×8 block in normal order
     * @param prevDC The previous DC coefficient for prediction
     * @param bw The BitWriter to write encoded bits to
     * @return The current DC coefficient (to be used as prevDC for next block)
     */
    std::int16_t encodeChromaBlock(const core::Block<std::int16_t, core::BlockSize>& block,
                                   std::int16_t prevDC,
                                   util::BitWriter& bw) const;

private:
    const HuffmanEncoder& m_lumaEncoder;
    const HuffmanEncoder& m_chromaEncoder;
};

} // namespace jpegdsp::jpeg
