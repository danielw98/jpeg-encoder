#include "jpegdsp/api/JPEGEncoder.hpp"
#include "jpegdsp/util/FileIO.hpp"
#include "jpegdsp/core/Image.hpp"
#include <iostream>
#include <string>
#include <iomanip>
#include <cstdlib>
#include <algorithm>

// ---------------------------------------------------------------------
// CLI argument structure
// ---------------------------------------------------------------------
struct CLIArgs
{
    std::string inputPath;
    std::string outputPath;
    int quality = 75;
    jpegdsp::api::JPEGEncoder::Format format = jpegdsp::api::JPEGEncoder::Format::COLOR_420;
    bool printJson = false;
    bool showHelp = false;
};

// ---------------------------------------------------------------------
// Print usage
// ---------------------------------------------------------------------
void printUsage(const char* programName)
{
    std::cout << "jpegdsp_cli_encode - JPEG encoder command-line tool\n\n";
    std::cout << "Usage:\n";
    std::cout << "  " << programName << " --input <file> --output <file> [options]\n\n";
    std::cout << "Required:\n";
    std::cout << "  --input <path>    Input image file (PPM/PGM format)\n";
    std::cout << "  --output <path>   Output JPEG file path\n\n";
    std::cout << "Options:\n";
    std::cout << "  --quality <1-100> JPEG quality level (default: 75)\n";
    std::cout << "  --format <mode>   Encoding format: grayscale | color_420 (default: color_420)\n";
    std::cout << "  --json            Print JSON encoding result to stdout\n";
    std::cout << "  --help            Show this help message\n\n";
    std::cout << "Examples:\n";
    std::cout << "  " << programName << " --input lena.ppm --output lena.jpg --quality 85\n";
    std::cout << "  " << programName << " --input test.pgm --output test.jpg --format grayscale --json\n";
}

// ---------------------------------------------------------------------
// Parse command-line arguments
// ---------------------------------------------------------------------
bool parseArgs(int argc, char** argv, CLIArgs& args)
{
    for (int i = 1; i < argc; ++i)
    {
        std::string arg = argv[i];
        
        if (arg == "--help" || arg == "-h")
        {
            args.showHelp = true;
            return true;
        }
        else if (arg == "--input" && i + 1 < argc)
        {
            args.inputPath = argv[++i];
        }
        else if (arg == "--output" && i + 1 < argc)
        {
            args.outputPath = argv[++i];
        }
        else if (arg == "--quality" && i + 1 < argc)
        {
            args.quality = std::atoi(argv[++i]);
            if (args.quality < 1 || args.quality > 100)
            {
                std::cerr << "Error: Quality must be in range [1-100]\n";
                return false;
            }
        }
        else if (arg == "--format" && i + 1 < argc)
        {
            std::string fmt = argv[++i];
            if (fmt == "grayscale")
            {
                args.format = jpegdsp::api::JPEGEncoder::Format::GRAYSCALE;
            }
            else if (fmt == "color_420")
            {
                args.format = jpegdsp::api::JPEGEncoder::Format::COLOR_420;
            }
            else
            {
                std::cerr << "Error: Unknown format '" << fmt << "'. Use 'grayscale' or 'color_420'\n";
                return false;
            }
        }
        else if (arg == "--json")
        {
            args.printJson = true;
        }
        else
        {
            std::cerr << "Error: Unknown argument '" << arg << "'\n";
            return false;
        }
    }
    
    // Validate required arguments
    if (!args.showHelp)
    {
        if (args.inputPath.empty())
        {
            std::cerr << "Error: Missing required argument --input\n";
            return false;
        }
        if (args.outputPath.empty())
        {
            std::cerr << "Error: Missing required argument --output\n";
            return false;
        }
    }
    
    return true;
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------
int main(int argc, char** argv)
{
    CLIArgs args;
    
    if (!parseArgs(argc, argv, args))
    {
        std::cerr << "Use --help for usage information\n";
        return EXIT_FAILURE;
    }
    
    if (args.showHelp)
    {
        printUsage(argv[0]);
        return EXIT_SUCCESS;
    }
    
    try
    {
        // Load input image
        jpegdsp::core::Image img;
        
        // Check file extension (C++17 compatible)
        std::string lowerPath = args.inputPath;
        std::transform(lowerPath.begin(), lowerPath.end(), lowerPath.begin(), ::tolower);
        
        // Try to load using ImageIO
        if (lowerPath.find(".ppm") != std::string::npos || 
            lowerPath.find(".pgm") != std::string::npos ||
            lowerPath.find(".png") != std::string::npos)
        {
            img = jpegdsp::util::ImageIO::loadImage(args.inputPath);
        }
        else
        {
            std::cerr << "Error: Unsupported input format. Use PPM, PGM, or PNG files.\n";
            return EXIT_FAILURE;
        }
        
        // Encode to JPEG
        auto result = jpegdsp::api::JPEGEncoder::encodeToFile(
            img,
            args.outputPath,
            args.quality,
            args.format
        );
        
        // Print results
        if (args.printJson)
        {
            std::cout << result.toJson() << std::endl;
        }
        else
        {
            std::cout << "Encoding successful!\n";
            std::cout << "  Input:  " << args.inputPath << " (" 
                      << result.originalWidth << "×" << result.originalHeight << ")\n";
            std::cout << "  Output: " << args.outputPath << "\n";
            std::cout << "  Original size:    " << result.originalBytes << " bytes\n";
            std::cout << "  Compressed size:  " << result.compressedBytes << " bytes\n";
            std::cout << "  Compression ratio: " << std::fixed << std::setprecision(2) 
                      << result.compressionRatio << "x\n";
        }
        
        return EXIT_SUCCESS;
    }
    catch (const std::exception& e)
    {
        std::cerr << "Error: " << e.what() << "\n";
        return EXIT_FAILURE;
    }
}
