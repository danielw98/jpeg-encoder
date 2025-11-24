#pragma once
#include <array>
#include <cstdint>
#include "../jpeg/RLE.hpp"

namespace jpegdsp {
namespace util { class BitWriter; }
}

namespace jpegdsp::jpeg {

enum class HuffmanTableType {
    DC_Luma,
    DC_Chroma,
    AC_Luma,
    AC_Chroma
};

struct HuffmanCode {
    std::uint16_t code;
    std::uint8_t length;
};

class HuffmanTable {
public:
    HuffmanTable();
    explicit HuffmanTable(HuffmanTableType type);

    const HuffmanCode& codeFor(std::uint8_t symbol) const;

private:
    std::array<HuffmanCode, 256> m_codes{};
};

class HuffmanEncoder {
public:
    HuffmanEncoder(const HuffmanTable& dcTable,
                   const HuffmanTable& acTable);

    void encodeBlockDC(std::int16_t dcDiff, util::BitWriter& bw) const;
    void encodeBlockAC(const std::vector<RLESymbol>& acSymbols,
                       util::BitWriter& bw) const;

private:
    const HuffmanTable& m_dcTable;
    const HuffmanTable& m_acTable;
};

} // namespace jpegdsp::jpeg
