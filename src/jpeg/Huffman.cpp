#include "jpegdsp/jpeg/Huffman.hpp"
#include "jpegdsp/jpeg/HuffmanTables.hpp"
#include "jpegdsp/util/BitWriter.hpp"
#include <array>

namespace jpegdsp::jpeg {

// Huffman tables now defined in HuffmanTables.hpp (ITU-T.81 Annex K.3)


// --------------------------------------------------------------------
// DC Category calculation helper
// --------------------------------------------------------------------
// Returns the JPEG DC category (number of bits needed to represent value)
// Category 0: value = 0
// Category 1: value = ±1
// Category 2: value = ±2..±3
// Category 3: value = ±4..±7
// etc.
// --------------------------------------------------------------------
static int categoryDC(int value)
{
    if (value == 0)
    {
        return 0;
    }

    int magnitude = (value < 0) ? -value : value;
    int category = 0;

    while (magnitude > 0)
    {
        magnitude >>= 1;
        category++;
    }

    return category;
}


// --------------------------------------------------------------------
// Canonical Huffman Table builder
// --------------------------------------------------------------------
static std::array<HuffmanCode, 256> buildCanonical(
    const std::array<uint8_t,16>& nbits,
    const uint8_t* vals,
    size_t valCount)
{
    std::array<HuffmanCode, 256> out{};
    uint16_t code = 0;
    size_t valIndex = 0;

    for (size_t bitLen = 1; bitLen <= 16; bitLen++)
    {
        uint8_t count = nbits[bitLen-1];

        for (uint8_t i = 0; i < count; i++, valIndex++)
        {
            uint8_t symbol = vals[valIndex];
            out[symbol] = HuffmanCode{ code, static_cast<uint8_t>(bitLen) };
            code++;
        }

        code <<= 1; // move to next bit-length
    }

    return out;
}


// --------------------------------------------------------------------
// HuffmanTable constructors
// --------------------------------------------------------------------
HuffmanTable::HuffmanTable()
{
    // Build DC luminance table by default.
    m_codes = buildCanonical(
        StandardHuffmanTables::DC_LUMA_NBITS,
        StandardHuffmanTables::DC_LUMA_VALS.data(),
        StandardHuffmanTables::DC_LUMA_VALS.size()
    );
}

HuffmanTable::HuffmanTable(HuffmanTableType type)
{
    switch (type)
    {
    case HuffmanTableType::DC_Luma:
        m_codes = buildCanonical(
            StandardHuffmanTables::DC_LUMA_NBITS,
            StandardHuffmanTables::DC_LUMA_VALS.data(),
            StandardHuffmanTables::DC_LUMA_VALS.size()
        );
        break;

    case HuffmanTableType::DC_Chroma:
        m_codes = buildCanonical(
            StandardHuffmanTables::DC_CHROMA_NBITS,
            StandardHuffmanTables::DC_CHROMA_VALS.data(),
            StandardHuffmanTables::DC_CHROMA_VALS.size()
        );
        break;

    case HuffmanTableType::AC_Luma:
        m_codes = buildCanonical(
            StandardHuffmanTables::AC_LUMA_NBITS,
            StandardHuffmanTables::AC_LUMA_VALS.data(),
            StandardHuffmanTables::AC_LUMA_VALS.size()
        );
        break;

    case HuffmanTableType::AC_Chroma:
        m_codes = buildCanonical(
            StandardHuffmanTables::AC_CHROMA_NBITS,
            StandardHuffmanTables::AC_CHROMA_VALS.data(),
            StandardHuffmanTables::AC_CHROMA_VALS.size()
        );
        break;
    }
}

const HuffmanCode& HuffmanTable::codeFor(std::uint8_t symbol) const
{
    return m_codes[symbol];
}


// --------------------------------------------------------------------
// HuffmanEncoder constructor
// --------------------------------------------------------------------
HuffmanEncoder::HuffmanEncoder(const HuffmanTable& dcTable,
                               const HuffmanTable& acTable)
    : m_dcTable(dcTable), m_acTable(acTable)
{
}


// --------------------------------------------------------------------
// DC Encoding
// --------------------------------------------------------------------
void HuffmanEncoder::encodeBlockDC(std::int16_t dcDiff, util::BitWriter& bw) const
{
    // Calculate category using helper function
    int category = categoryDC(dcDiff);

    // Huffman code for category
    const HuffmanCode& hc = m_dcTable.codeFor(static_cast<uint8_t>(category));
    bw.writeBits(hc.code, hc.length);

    // Write the magnitude bits
    if (category > 0)
    {
        uint16_t bits;
        int16_t value = dcDiff;

        if (value < 0)
            bits = (~(-value)) & ((1 << category) - 1);
        else
            bits = static_cast<uint16_t>(value);

        bw.writeBits(bits, static_cast<uint8_t>(category));
    }
}


// --------------------------------------------------------------------
// AC Encoding (RLE symbols)
// --------------------------------------------------------------------
void HuffmanEncoder::encodeBlockAC(
    const std::vector<RLESymbol>& acSymbols,
    util::BitWriter& bw) const
{
    for (const auto& s : acSymbols)
    {
        uint8_t run = s.run;
        int16_t val = s.value;

        // Zero-run symbol is encoded as 0xF0
        if (run == 15 && val == 0)
        {
            const HuffmanCode& zz = m_acTable.codeFor(0xF0);
            bw.writeBits(zz.code, zz.length);
            continue;
        }

        // Determine category
        uint16_t magnitude = (val < 0) ? -val : val;

        uint8_t category = 0;
        while (magnitude)
        {
            magnitude >>= 1;
            category++;
        }

        // Combine run + category into JPEG AC symbol
        uint8_t symbol = (run << 4) | category;

        const HuffmanCode& hc = m_acTable.codeFor(symbol);
        bw.writeBits(hc.code, hc.length);

        // Write magnitude bits
        if (category > 0)
        {
            uint16_t bits;

            if (val < 0)
                bits = (~(-val)) & ((1 << category) - 1);
            else
                bits = val;

            bw.writeBits(bits, category);
        }
    }

    // EOB is now emitted by RLE::encodeAC when needed (per ITU-T.81)
}

} // namespace jpegdsp::jpeg
