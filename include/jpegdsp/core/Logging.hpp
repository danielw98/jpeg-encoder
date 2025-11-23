#pragma once
#include <string>

namespace jpegdsp::core {

enum class LogLevel { Error, Warning, Info, Debug };

void setLogLevel(LogLevel level);
void log(LogLevel level, const std::string& msg);

} // namespace jpegdsp::core
