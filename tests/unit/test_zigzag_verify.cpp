/**
 * @file test_zigzag_verify.cpp
 * @brief Verify zigzag pattern is correct
 */

#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/jpeg/ZigZag.hpp"
#include <iostream>
#include <iomanip>

using namespace jpegdsp;

int main()
{
    // Create a block with sequential values 0-63
    core::Block8x8i block;
    for (std::size_t y = 0; y < 8; ++y)
    {
        for (std::size_t x = 0; x < 8; ++x)
        {
            block.at(x, y) = static_cast<std::int16_t>(y * 8 + x);
        }
    }
    
    std::cout << "Original block (row-major, values 0-63):\n";
    for (std::size_t y = 0; y < 8; ++y)
    {
        for (std::size_t x = 0; x < 8; ++x)
        {
            std::cout << std::setw(3) << block.at(x, y) << " ";
        }
        std::cout << "\n";
    }
    std::cout << "\n";
    
    // Apply zigzag
    auto zigzagged = jpeg::ZigZag::toZigZag(block);
    
    std::cout << "After zigzag scan (should follow diagonal pattern):\n";
    std::cout << "Expected: 0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5...\n";
    std::cout << "Actual:   ";
    for (std::size_t i = 0; i < 16; ++i)
    {
        std::cout << zigzagged[i];
        if (i < 15) std::cout << ", ";
    }
    std::cout << "...\n\n";
    
    // Check specific values
    std::cout << "Verification:\n";
    std::cout << "zigzag[0] = " << zigzagged[0] << " (should be 0 from position (0,0))\n";
    std::cout << "zigzag[1] = " << zigzagged[1] << " (should be 1 from position (1,0))\n";
    std::cout << "zigzag[2] = " << zigzagged[2] << " (should be 8 from position (0,1))\n";
    std::cout << "zigzag[3] = " << zigzagged[3] << " (should be 16 from position (0,2))\n";
    std::cout << "zigzag[4] = " << zigzagged[4] << " (should be 9 from position (1,1))\n";
    std::cout << "zigzag[5] = " << zigzagged[5] << " (should be 2 from position (2,0))\n";
    
    bool correct = (zigzagged[0] == 0 && zigzagged[1] == 1 && zigzagged[2] == 8 && 
                    zigzagged[3] == 16 && zigzagged[4] == 9 && zigzagged[5] == 2);
    
    std::cout << "\n" << (correct ? "[PASS]" : "[FAIL]") << " Zigzag pattern verification\n";
    
    return correct ? 0 : 1;
}
