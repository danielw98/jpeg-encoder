#include "jpegdsp/transforms/DCTTransform.hpp"
#include "jpegdsp/core/Constants.hpp"
#include <cmath>

namespace jpegdsp::transforms {

DCT8x8Transform::DCT8x8Transform()
{
    // Normalization factors for orthonormal DCT-II
    for (std::size_t u = 0; u < jpegdsp::core::BlockSize; u++)
    {
        if (u == 0)
        {
            m_alpha[u] = static_cast<float>(1.0 / std::sqrt(2.0));
        }
        else
        {
            m_alpha[u] = 1.0f;
        }
    }

    constexpr double pi = 3.14159265358979323846;

    // Precompute cos((2x+1)uπ/16) for x,u in [0,7]
    for (std::size_t x = 0; x < jpegdsp::core::BlockSize; x++)
    {
        for (std::size_t u = 0; u < jpegdsp::core::BlockSize; u++)
        {
            double angle = (2.0 * static_cast<double>(x) + 1.0)
                           * static_cast<double>(u) * pi / 16.0;
            m_cosTable[x][u] = static_cast<float>(std::cos(angle));
        }
    }
}

void DCT8x8Transform::forward(const jpegdsp::core::Block<float,8>& in,
                              jpegdsp::core::Block<float,8>& out) const
{
    // 2D DCT-II (orthonormal):
    // C(u,v) = 1/4 * α(u) α(v) Σx Σy f(x,y) cos((2x+1)uπ/16) cos((2y+1)vπ/16)

    constexpr float scale = 0.25f;

    for (std::size_t v = 0; v < jpegdsp::core::BlockSize; v++)
    {
        for (std::size_t u = 0; u < jpegdsp::core::BlockSize; u++)
        {
            double sum = 0.0;

            for (std::size_t y = 0; y < jpegdsp::core::BlockSize; y++)
            {
                for (std::size_t x = 0; x < jpegdsp::core::BlockSize; x++)
                {
                    float fxy = in.at(x, y);
                    float cxu = m_cosTable[x][u];
                    float cyv = m_cosTable[y][v];

                    sum += static_cast<double>(fxy) * static_cast<double>(cxu) * static_cast<double>(cyv);
                }
            }

            double coeff = static_cast<double>(scale)
                           * static_cast<double>(m_alpha[u])
                           * static_cast<double>(m_alpha[v])
                           * sum;

            out.at(u, v) = static_cast<float>(coeff);
        }
    }
}

void DCT8x8Transform::inverse(const jpegdsp::core::Block<float,8>& in,
                              jpegdsp::core::Block<float,8>& out) const
{
    // Inverse DCT (same cos/alpha, summed over u,v):
    // f(x,y) = 1/4 Σu Σv α(u) α(v) C(u,v) cos((2x+1)uπ/16) cos((2y+1)vπ/16)

    constexpr float scale = 0.25f;

    for (std::size_t y = 0; y < jpegdsp::core::BlockSize; y++)
    {
        for (std::size_t x = 0; x < jpegdsp::core::BlockSize; x++)
        {
            double sum = 0.0;

            for (std::size_t v = 0; v < jpegdsp::core::BlockSize; v++)
            {
                for (std::size_t u = 0; u < jpegdsp::core::BlockSize; u++)
                {
                    float cuv = in.at(u, v);
                    float cxu = m_cosTable[x][u];
                    float cyv = m_cosTable[y][v];

                    double term = static_cast<double>(m_alpha[u])
                                  * static_cast<double>(m_alpha[v])
                                  * static_cast<double>(cuv)
                                  * static_cast<double>(cxu)
                                  * static_cast<double>(cyv);

                    sum += term;
                }
            }

            double val = static_cast<double>(scale) * sum;
            out.at(x, y) = static_cast<float>(val);
        }
    }
}

} // namespace jpegdsp::transforms