#pragma once
#include "jpegdsp/core/Block.hpp"

namespace jpegdsp::transforms {

template<typename T, std::size_t DCTBlockSize>
class ITransform2D {
public:
    virtual ~ITransform2D() = default;

    virtual void forward(const jpegdsp::core::Block<T,DCTBlockSize>& in,
                         jpegdsp::core::Block<T,DCTBlockSize>& out) const = 0;

    virtual void inverse(const jpegdsp::core::Block<T,DCTBlockSize>& in,
                         jpegdsp::core::Block<T,DCTBlockSize>& out) const = 0;
};

} // namespace jpegdsp::transforms
