#pragma once
#include <array>
#include <cstddef>
#include <cstdint>
#include <vector>
#include <cmath>

namespace jpegdsp::core {

class Entropy {
public:
    template<typename Container>
    static double shannon(const Container& data) {
        if (data.empty()) return 0.0;
        std::array<std::size_t, 256> hist{};
        for (auto v : data) {
            std::uint8_t u = static_cast<std::uint8_t>(v);
            ++hist[u];
        }
        const double total = static_cast<double>(data.size());
        double H = 0.0;
        for (auto count : hist) {
            if (count == 0) continue;
            double p = static_cast<double>(count) / total;
            H -= p * std::log2(p);
        }
        return H;
    }
};

} // namespace jpegdsp::core
