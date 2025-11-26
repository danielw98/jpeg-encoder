#include "jpegdsp/util/FileIO.hpp"
#include "jpegdsp/core/Image.hpp"
#include <iostream>
#include <iomanip>

int main()
{
    try
    {
        auto img = jpegdsp::util::ImageIO::loadImage("data/standard_test_images/baboon_512.png");
        
        std::cout << "Image loaded: " << img.width() << "x" << img.height() 
                  << " channels=" << img.channels() << std::endl;
        std::cout << "Color space: " << (int)img.colorSpace() << std::endl;
        
        // Print first few pixels
        std::cout << "\nFirst 5×5 pixels (RGB):\n";
        for (size_t y = 0; y < 5; ++y)
        {
            for (size_t x = 0; x < 5; ++x)
            {
                int r = img.at(x, y, 0);
                int g = img.at(x, y, 1);
                int b = img.at(x, y, 2);
                std::cout << "(" << std::setw(3) << r << "," << std::setw(3) << g << "," << std::setw(3) << b << ") ";
            }
            std::cout << "\n";
        }
        
        // Check if all pixels are same (which would indicate loading error)
        bool allSame = true;
        int firstR = img.at(0, 0, 0);
        int firstG = img.at(0, 0, 1);
        int firstB = img.at(0, 0, 2);
        
        for (size_t y = 0; y < img.height() && allSame; ++y)
        {
            for (size_t x = 0; x < img.width() && allSame; ++x)
            {
                if (img.at(x, y, 0) != firstR || img.at(x, y, 1) != firstG || img.at(x, y, 2) != firstB)
                {
                    allSame = false;
                }
            }
        }
        
        if (allSame)
        {
            std::cout << "\nWARNING: All pixels are identical! (" << firstR << "," << firstG << "," << firstB << ")\n";
        }
        else
        {
            std::cout << "\nPixels vary (good)\n";
        }
        
        return 0;
    }
    catch (const std::exception& e)
    {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}
