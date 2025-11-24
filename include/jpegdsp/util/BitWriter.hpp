#pragma once
#include <cstdint>
#include <vector>

namespace jpegdsp::util {

class BitWriter {
public:
    BitWriter();

    // Write up to 16 bits at a time
    void writeBits(std::uint16_t bits, std::uint8_t length);

    // Flush any remaining bits to the buffer (pad with 1s to byte boundary)
    void flushToByte();

    // Get the output buffer
    const std::vector<std::uint8_t>& buffer() const;

private:
    std::vector<std::uint8_t> m_buffer;
    std::uint32_t m_bitBuffer;
    std::uint8_t m_bitCount;

    void emitByte(std::uint8_t byte);
};

} // namespace jpegdsp::util
