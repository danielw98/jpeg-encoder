#include "jpegdsp/util/BitWriter.hpp"

namespace jpegdsp::util {

BitWriter::BitWriter(std::ostream& os)
    : m_os(os), m_buffer(0), m_bitCount(0)
{}

BitWriter::~BitWriter() {
    flush();
}

void BitWriter::writeBits(std::uint16_t bits, std::uint8_t length) {
    (void)bits;
    (void)length;
    // TODO
}

void BitWriter::flush() {
    // TODO: write remaining bits to m_os
}

} // namespace jpegdsp::util
