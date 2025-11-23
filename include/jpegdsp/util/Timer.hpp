#pragma once
#include <chrono>

namespace jpegdsp::util {

class Timer {
public:
    Timer();

    void reset();
    double elapsedMs() const;

private:
    std::chrono::steady_clock::time_point m_start;
};

} // namespace jpegdsp::util
