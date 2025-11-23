#include "jpegdsp/util/Timer.hpp"

namespace jpegdsp::util {

Timer::Timer() : m_start(std::chrono::steady_clock::now()) {}

void Timer::reset() {
    m_start = std::chrono::steady_clock::now();
}

double Timer::elapsedMs() const {
    auto now = std::chrono::steady_clock::now();
    auto diff = std::chrono::duration_cast<std::chrono::milliseconds>(now - m_start);
    return static_cast<double>(diff.count());
}

} // namespace jpegdsp::util
