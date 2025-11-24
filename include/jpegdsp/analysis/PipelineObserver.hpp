#pragma once
#include <cstddef>
#include <string>
#include "jpegdsp/core/Block.hpp"
#include "jpegdsp/core/Types.hpp"

namespace jpegdsp::analysis {

struct BlockDCTInfo {
    jpegdsp::core::Block<float,8> dct;
    jpegdsp::jpeg::Component component;
    std::size_t blockX;
    std::size_t blockY;
};

class PipelineObserver {
public:
    virtual ~PipelineObserver() = default;

    virtual void onBlockDCT(const BlockDCTInfo& info) {}
    virtual void onEntropyStage(const std::string& stageName,
                                double entropyValue) {}
};

} // namespace jpegdsp::analysis
