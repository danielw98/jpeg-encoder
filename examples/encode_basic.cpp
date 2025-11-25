#include "jpegdsp/core/Image.hpp"
#include "jpegdsp/jpeg/JPEGWriter.hpp"
#include <iostream>
#include <fstream>
#include <vector>

using namespace jpegdsp;

int main()
{
    try
    {
        // Create a 64×64 grayscale gradient test image
        const size_t width = 64;
        const size_t height = 64;
        core::Image img(width, height, core::ColorSpace::GRAY, 1);
        
        std::cout << "Creating " << width << "×" << height << " gradient test image..." << std::endl;
        
        // Fill with horizontal gradient (0 on left, 255 on right)
        for (size_t y = 0; y < height; ++y)
        {
            for (size_t x = 0; x < width; ++x)
            {
                uint8_t value = static_cast<uint8_t>((x * 255) / (width - 1));
                img.at(x, y, 0) = value;
            }
        }
        
        // Encode to JPEG at quality 75
        std::cout << "Encoding to JPEG (quality 75)..." << std::endl;
        jpeg::JPEGWriter writer;
        std::vector<uint8_t> jpegData = writer.encodeGrayscale(img, 75);
        
        // Calculate compression stats
        size_t originalSize = width * height;  // 1 byte per pixel
        size_t compressedSize = jpegData.size();
        double compressionRatio = static_cast<double>(originalSize) / compressedSize;
        
        std::cout << "Original size:    " << originalSize << " bytes" << std::endl;
        std::cout << "Compressed size:  " << compressedSize << " bytes" << std::endl;
        std::cout << "Compression ratio: " << compressionRatio << "x" << std::endl;
        
        // Save to file
        const char* filename = "output_gradient.jpg";
        std::ofstream outFile(filename, std::ios::binary);
        if (!outFile)
        {
            std::cerr << "Error: Failed to open " << filename << " for writing" << std::endl;
            return 1;
        }
        
        outFile.write(reinterpret_cast<const char*>(jpegData.data()), jpegData.size());
        outFile.close();
        
        std::cout << "Saved to " << filename << std::endl;
        std::cout << "\nNow try opening " << filename << " in Windows Paint or a web browser!" << std::endl;
        std::cout << "If it opens successfully, the encoder is working correctly." << std::endl;
        
        return 0;
    }
    catch (const std::exception& e)
    {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}
