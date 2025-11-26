// test_huffman_dc_debug.cpp - Debug DC Huffman encoding
#include "../../include/jpegdsp/jpeg/Huffman.hpp"
#include "../../include/jpegdsp/util/BitWriter.hpp"
#include <iostream>
#include <iomanip>

using namespace jpegdsp;

void testDCEncoding(int16_t dcDiff, const std::string& label) {
    std::cout << "\n=== " << label << " ===\n";
    std::cout << "DC diff: " << dcDiff << "\n";
    
    util::BitWriter bw;
    jpeg::HuffmanTable dcTable(jpeg::HuffmanTableType::DC_Luma);
    jpeg::HuffmanTable acTable(jpeg::HuffmanTableType::AC_Luma);
    jpeg::HuffmanEncoder encoder(dcTable, acTable);
    
    encoder.encodeBlockDC(dcDiff, bw);
    bw.flushToByte();
    
    const auto& bytes = bw.buffer();
    std::cout << "Encoded bytes: " << bytes.size() << " bytes\n";
    std::cout << "Hex: ";
    for (auto b : bytes) {
        std::cout << std::hex << std::setw(2) << std::setfill('0') 
                  << static_cast<int>(b) << " ";
    }
    std::cout << std::dec << "\n";
    
    // Calculate expected category
    int magnitude = (dcDiff < 0) ? -dcDiff : dcDiff;
    int category = 0;
    int temp = magnitude;
    while (temp > 0) {
        temp >>= 1;
        category++;
    }
    
    std::cout << "Category: " << category << "\n";
    std::cout << "Magnitude: " << magnitude << "\n";
    
    if (dcDiff < 0) {
        int complement = (1 << category) - 1 - magnitude;
        std::cout << "Complement (for negative): " << complement << "\n";
    }
}

int main() {
    std::cout << "=== DC Huffman Encoding Debug ===\n";
    
    // Test various DC differences
    testDCEncoding(0, "DC diff = 0 (category 0)");
    testDCEncoding(1, "DC diff = +1");
    testDCEncoding(-1, "DC diff = -1");
    testDCEncoding(64, "DC diff = +64 (uniform gray 128 - 64 = 64)");
    testDCEncoding(128, "DC diff = +128 (first block, prev=0)");
    testDCEncoding(-64, "DC diff = -64");
    
    std::cout << "\n=== Sequence Test (like our stepped image) ===\n";
    std::cout << "Block 0 (DC=64,  prevDC=0):   diff = 64\n";
    std::cout << "Block 1 (DC=128, prevDC=64):  diff = 64\n";
    std::cout << "Block 2 (DC=192, prevDC=128): diff = 64\n";
    std::cout << "Block 3 (DC=255, prevDC=192): diff = 63\n";
    
    util::BitWriter bw;
    jpeg::HuffmanTable dcTable(jpeg::HuffmanTableType::DC_Luma);
    jpeg::HuffmanTable acTable(jpeg::HuffmanTableType::AC_Luma);
    jpeg::HuffmanEncoder encoder(dcTable, acTable);
    
    int16_t prevDC = 0;
    std::vector<int16_t> dcValues = {64, 128, 192, 255};
    
    for (size_t i = 0; i < dcValues.size(); ++i) {
        int16_t dc = dcValues[i];
        int16_t diff = dc - prevDC;
        std::cout << "\nBlock " << i << ": DC=" << dc << ", diff=" << diff << "\n";
        encoder.encodeBlockDC(diff, bw);
        prevDC = dc;
    }
    
    bw.flushToByte();
    const auto& bytes = bw.buffer();
    std::cout << "\nTotal encoded: " << bytes.size() << " bytes\n";
    std::cout << "Hex: ";
    for (auto b : bytes) {
        std::cout << std::hex << std::setw(2) << std::setfill('0') 
                  << static_cast<int>(b) << " ";
    }
    std::cout << std::dec << "\n";
    
    return 0;
}
