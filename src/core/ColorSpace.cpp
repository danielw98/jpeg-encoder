#include "jpegdsp/core/ColorSpace.hpp"
#include <stdexcept>
#include <algorithm> // for std::clamp

namespace jpegdsp::core {

namespace
{
    inline uint8_t clampToByte(double v)
    {
        if (v < 0.0)
        {
            return 0;
        }
        if (v > 255.0)
        {
            return 255;
        }
        return static_cast<uint8_t>(v + 0.5);
    }
}

Image ColorConverter::RGBtoYCbCr(const Image& rgb)
{
    if (rgb.colorSpace() != ColorSpace::RGB || rgb.channels() != 3)
    {
        throw std::invalid_argument("RGBtoYCbCr: expected RGB image with 3 channels");
    }

    std::size_t w = rgb.width();
    std::size_t h = rgb.height();

    Image ycbcr(w, h, ColorSpace::YCbCr, 3);

    const Pixel8* src = rgb.data();
    Pixel8* dst = ycbcr.data();

    std::size_t stride = w * 3;

    for (std::size_t y = 0; y < h; y++)
    {
        const Pixel8* rowSrc = src + y * stride;
        Pixel8* rowDst = dst + y * stride;

        for (std::size_t x = 0; x < w; x++)
        {
            std::size_t idx = x * 3;

            double R = static_cast<double>(rowSrc[idx + 0]);
            double G = static_cast<double>(rowSrc[idx + 1]);
            double B = static_cast<double>(rowSrc[idx + 2]);

            double Y  =  0.299    * R + 0.587    * G + 0.114    * B;
            double Cb = -0.168736 * R - 0.331264 * G + 0.5      * B + 128.0;
            double Cr =  0.5      * R - 0.418688 * G - 0.081312 * B + 128.0;

            rowDst[idx + 0] = clampToByte(Y);
            rowDst[idx + 1] = clampToByte(Cb);
            rowDst[idx + 2] = clampToByte(Cr);
        }
    }

    return ycbcr;
}

Image ColorConverter::YCbCrtoRGB(const Image& ycbcr)
{
    if (ycbcr.colorSpace() != ColorSpace::YCbCr || ycbcr.channels() != 3)
    {
        throw std::invalid_argument("YCbCrtoRGB: expected YCbCr image with 3 channels");
    }

    std::size_t w = ycbcr.width();
    std::size_t h = ycbcr.height();

    Image rgb(w, h, ColorSpace::RGB, 3);

    const Pixel8* src = ycbcr.data();
    Pixel8* dst = rgb.data();

    std::size_t stride = w * 3;

    for (std::size_t y = 0; y < h; y++)
    {
        const Pixel8* rowSrc = src + y * stride;
        Pixel8* rowDst = dst + y * stride;

        for (std::size_t x = 0; x < w; x++)
        {
            std::size_t idx = x * 3;

            double Y  = static_cast<double>(rowSrc[idx + 0]);
            double Cb = static_cast<double>(rowSrc[idx + 1]) - 128.0;
            double Cr = static_cast<double>(rowSrc[idx + 2]) - 128.0;

            double R = Y + 1.402    * Cr;
            double G = Y - 0.344136 * Cb - 0.714136 * Cr;
            double B = Y + 1.772    * Cb;

            rowDst[idx + 0] = clampToByte(R);
            rowDst[idx + 1] = clampToByte(G);
            rowDst[idx + 2] = clampToByte(B);
        }
    }

    return rgb;
}

} // namespace jpegdsp::core