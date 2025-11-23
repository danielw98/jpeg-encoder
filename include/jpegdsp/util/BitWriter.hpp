#pragma once
#include <cstdint>
#include <ostream>

namespace jpegdsp::util {

class BitWriter {
public:
    explicit BitWriter(std::ostream& os);
    ~BitWriter();

    void writeBits(std::uint16_t bits, std::uint8_t length);

private:
    std::ostream& m_os;
    std::uint8_t m_buffer;
    std::uint8_t m_bitCount;

    void flush();
};

} // namespace jpegdsp::util
