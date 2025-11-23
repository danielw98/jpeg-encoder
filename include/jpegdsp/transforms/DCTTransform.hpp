#pragma once
#include "ITransform2D.hpp"

namespace jpegdsp::transforms {

class DCT8x8Transform : public ITransform2D<float, 8> {
public:
    DCT8x8Transform();

    void forward(const jpegdsp::core::Block<float,8>& in,
                 jpegdsp::core::Block<float,8>& out) const override;

    void inverse(const jpegdsp::core::Block<float,8>& in,
                 jpegdsp::core::Block<float,8>& out) const override;

private:
    float m_alpha[8]{};
    float m_cosTable[8][8]{};
};

} // namespace jpegdsp::transforms
