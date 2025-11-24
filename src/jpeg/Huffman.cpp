#include "jpegdsp/jpeg/Huffman.hpp"
#include "jpegdsp/util/BitWriter.hpp"
#include <array>

namespace jpegdsp::jpeg {

// --------------------------------------------------------------------
// Standard JPEG Huffman table definitions
// --------------------------------------------------------------------
// These tables correspond to Annex K.3 of the JPEG standard.
// They are canonical Huffman tables used for baseline JPEG.
// --------------------------------------------------------------------

static const std::array<uint8_t, 16> STD_DC_LUMINANCE_NBITS = {
    0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0
};

static const std::array<uint8_t, 12> STD_DC_LUMINANCE_VALS = {
    0,1,2,3,4,5,6,7,8,9,10,11
};

static const std::array<uint8_t, 16> STD_AC_LUMINANCE_NBITS = {
    0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,125
};

// Full 162 AC values (Annex K.3.2):
static const std::array<uint8_t,162> STD_AC_LUMINANCE_VALS = {
    0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,
    0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,
    0x22,0x71,0x14,0x32,0x81,0x91,0xa1,0x08,
    0x23,0x42,0xb1,0xc1,0x15,0x52,0xd1,0xf0,
    0x24,0x33,0x62,0x72,0x82,0x09,0x0a,0x16,
    0x17,0x18,0x19,0x1a,0x25,0x26,0x27,0x28,
    0x29,0x2a,0x34,0x35,0x36,0x37,0x38,0x39,
    0x3a,0x43,0x44,0x45,0x46,0x47,0x48,0x49,
    0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,
    0x5a,0x63,0x64,0x65,0x66,0x67,0x68,0x69,
    0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,
    0x7a,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
    0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,
    0x99,0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,
    0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,
    0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,
    0xc6,0xc7,0xc8,0xc9,0xca,0xd2,0xd3,0xd4,
    0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xe1,0xe2,
    0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,
    0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
    0xf9,0xfa
};

static const std::array<uint8_t, 16> STD_DC_CHROMINANCE_NBITS = {
    0,3,1,1,1,1,1,1,1,1,1,0,0,0,0,0
};

static const std::array<uint8_t, 12> STD_DC_CHROMINANCE_VALS = {
    0,1,2,3,4,5,6,7,8,9,10,11
};

static const std::array<uint8_t, 16> STD_AC_CHROMINANCE_NBITS = {
    0,2,1,2,4,4,3,4,7,5,4,4,0,1,2,119
};

// Full 162 AC values (Annex K.3.2):
static const std::array<uint8_t,162> STD_AC_CHROMINANCE_VALS = {
    0x00,0x01,0x02,0x03,0x11,0x04,0x05,0x21,
    0x31,0x06,0x12,0x41,0x51,0x07,0x61,0x71,
    0x13,0x22,0x32,0x81,0x08,0x14,0x42,0x91,
    0xa1,0xb1,0xc1,0x09,0x23,0x33,0x52,0xf0,
    0x15,0x62,0x72,0xd1,0x0a,0x16,0x24,0x34,
    0xe1,0x25,0xf1,0x17,0x18,0x19,0x1a,0x26,
    0x27,0x28,0x29,0x2a,0x35,0x36,0x37,0x38,
    0x39,0x3a,0x43,0x44,0x45,0x46,0x47,0x48,
    0x49,0x4a,0x53,0x54,0x55,0x56,0x57,0x58,
    0x59,0x5a,0x63,0x64,0x65,0x66,0x67,0x68,
    0x69,0x6a,0x73,0x74,0x75,0x76,0x77,0x78,
    0x79,0x7a,0x82,0x83,0x84,0x85,0x86,0x87,
    0x88,0x89,0x8a,0x92,0x93,0x94,0x95,0x96,
    0x97,0x98,0x99,0x9a,0xa2,0xa3,0xa4,0xa5,
    0xa6,0xa7,0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,
    0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xc2,0xc3,
    0xc4,0xc5,0xc6,0xc7,0xc8,0xc9,0xca,0xd2,
    0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,
    0xe2,0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,
    0xea,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
    0xf9,0xfa
};


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
        STD_DC_LUMINANCE_NBITS,
        STD_DC_LUMINANCE_VALS.data(),
        STD_DC_LUMINANCE_VALS.size()
    );
}

HuffmanTable::HuffmanTable(HuffmanTableType type)
{
    switch (type)
    {
    case HuffmanTableType::DC_Luma:
        m_codes = buildCanonical(
            STD_DC_LUMINANCE_NBITS,
            STD_DC_LUMINANCE_VALS.data(),
            STD_DC_LUMINANCE_VALS.size()
        );
        break;

    case HuffmanTableType::DC_Chroma:
        m_codes = buildCanonical(
            STD_DC_CHROMINANCE_NBITS,
            STD_DC_CHROMINANCE_VALS.data(),
            STD_DC_CHROMINANCE_VALS.size()
        );
        break;

    case HuffmanTableType::AC_Luma:
        m_codes = buildCanonical(
            STD_AC_LUMINANCE_NBITS,
            STD_AC_LUMINANCE_VALS.data(),
            STD_AC_LUMINANCE_VALS.size()
        );
        break;

    case HuffmanTableType::AC_Chroma:
        m_codes = buildCanonical(
            STD_AC_CHROMINANCE_NBITS,
            STD_AC_CHROMINANCE_VALS.data(),
            STD_AC_CHROMINANCE_VALS.size()
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

    // IMPORTANT: AC symbols do NOT emit EOB here.
    // RLE must include EOB explicitly when needed.
}

} // namespace jpegdsp::jpeg
