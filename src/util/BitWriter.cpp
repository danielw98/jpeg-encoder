#include "jpegdsp/util/BitWriter.hpp"

namespace jpegdsp::util {

BitWriter::BitWriter()
    : m_bitBuffer(0), m_bitCount(0)
{
    m_buffer.reserve(1024); // Reserve some space to avoid frequent reallocations
}

void BitWriter::writeBits(std::uint16_t bits, std::uint8_t length)
{
    // Add bits to the buffer (MSB first)
    m_bitBuffer = (m_bitBuffer << length) | bits;
    m_bitCount += length;

    // Emit complete bytes
    while (m_bitCount >= 8)
    {
        m_bitCount -= 8;
        std::uint8_t byte = static_cast<std::uint8_t>(m_bitBuffer >> m_bitCount);
        emitByte(byte);
        m_bitBuffer &= (1u << m_bitCount) - 1; // Clear emitted bits
    }
}

void BitWriter::flushToByte()
{
    if (m_bitCount > 0)
    {
        // Pad with 1s to complete the byte (JPEG standard)
        std::uint8_t padBits = 8 - m_bitCount;
        std::uint8_t byte = static_cast<std::uint8_t>((m_bitBuffer << padBits) | ((1u << padBits) - 1));
        emitByte(byte);
        m_bitBuffer = 0;
        m_bitCount = 0;
    }
}

const std::vector<std::uint8_t>& BitWriter::buffer() const
{
    return m_buffer;
}

void BitWriter::emitByte(std::uint8_t byte)
{
    m_buffer.push_back(byte);

    // JPEG byte-stuffing: after 0xFF, insert 0x00
    if (byte == 0xFF)
    {
        m_buffer.push_back(0x00);
    }
}

} // namespace jpegdsp::util
