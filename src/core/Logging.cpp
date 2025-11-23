#include "jpegdsp/core/Logging.hpp"
#include <iostream>

namespace jpegdsp::core {

static LogLevel g_level = LogLevel::Info;

void setLogLevel(LogLevel level) {
    g_level = level;
}

void log(LogLevel level, const std::string& msg) {
    if (static_cast<int>(level) <= static_cast<int>(g_level)) {
        std::cerr << msg << std::endl;
    }
}

} // namespace jpegdsp::core
