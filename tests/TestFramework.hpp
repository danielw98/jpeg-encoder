/**
 * @file TestFramework.hpp
 * @brief Centralized test harness for jpegdsp unit and integration tests
 * 
 * Provides consistent test execution, reporting, and utilities across all
 * test executables. Eliminates duplicate runTest() implementations.
 */

#pragma once
#include <iostream>
#include <cmath>
#include <cstdlib>
#include <string>

namespace jpegdsp::test {

/**
 * @brief Test statistics tracker
 */
struct TestStats {
    int total = 0;
    int passed = 0;
    int failed = 0;
    
    void recordPass() { total++; passed++; }
    void recordFail() { total++; failed++; }
    
    int exitCode() const { return (failed == 0) ? EXIT_SUCCESS : EXIT_FAILURE; }
    
    void printSummary(const char* suiteName) const {
        std::cout << "----------------------------------------\n";
        std::cout << suiteName << " run:   " << total << "\n";
        std::cout << suiteName << " failed:" << failed << "\n";
    }
};

/**
 * @brief Run a single test case
 * 
 * @param name Test name (displayed in output)
 * @param testFunc Test function returning true on success, false on failure
 * @param stats Statistics tracker to update
 */
inline void runTest(const char* name, bool (*testFunc)(), TestStats& stats) {
    if (testFunc()) {
        std::cout << "[PASS] " << name << "\n";
        stats.recordPass();
    } else {
        std::cerr << "[FAIL] " << name << "\n";
        stats.recordFail();
    }
}

/**
 * @brief Floating-point comparison with epsilon tolerance
 * 
 * @param a First value
 * @param b Second value
 * @param epsilon Tolerance (default: 1e-3)
 * @return true if |a - b| <= epsilon
 */
inline bool closeFloat(float a, float b, float epsilon = 1e-3f) {
    return std::fabs(a - b) <= epsilon;
}

/**
 * @brief Double-precision floating-point comparison
 * 
 * @param a First value
 * @param b Second value
 * @param epsilon Tolerance (default: 1e-6)
 * @return true if |a - b| <= epsilon
 */
inline bool closeDouble(double a, double b, double epsilon = 1e-6) {
    return std::fabs(a - b) <= epsilon;
}

/**
 * @brief Check if integer values are equal with logging
 * 
 * @param expected Expected value
 * @param actual Actual value
 * @param context Description of what's being tested
 * @return true if equal, false otherwise (logs error)
 */
inline bool assertEqual(int expected, int actual, const char* context) {
    if (expected == actual) {
        return true;
    }
    std::cerr << "  Assertion failed [" << context << "]: "
              << "expected " << expected << ", got " << actual << "\n";
    return false;
}

/**
 * @brief Check if size_t values are equal with logging
 */
inline bool assertEqual(std::size_t expected, std::size_t actual, const char* context) {
    if (expected == actual) {
        return true;
    }
    std::cerr << "  Assertion failed [" << context << "]: "
              << "expected " << expected << ", got " << actual << "\n";
    return false;
}

/**
 * @brief Check if strings are equal with logging
 */
inline bool assertEqual(const std::string& expected, const std::string& actual, const char* context) {
    if (expected == actual) {
        return true;
    }
    std::cerr << "  Assertion failed [" << context << "]: "
              << "expected \"" << expected << "\", got \"" << actual << "\"\n";
    return false;
}

/**
 * @brief Check if float values are close with logging
 */
inline bool assertClose(float expected, float actual, const char* context, float epsilon = 1e-3f) {
    if (closeFloat(expected, actual, epsilon)) {
        return true;
    }
    std::cerr << "  Assertion failed [" << context << "]: "
              << "expected " << expected << ", got " << actual
              << " (diff: " << std::fabs(expected - actual) << ")\n";
    return false;
}

/**
 * @brief Check if double values are close with logging
 */
inline bool assertClose(double expected, double actual, const char* context, double epsilon = 1e-6) {
    if (closeDouble(expected, actual, epsilon)) {
        return true;
    }
    std::cerr << "  Assertion failed [" << context << "]: "
              << "expected " << expected << ", got " << actual
              << " (diff: " << std::fabs(expected - actual) << ")\n";
    return false;
}

/**
 * @brief Check if condition is true with logging
 */
inline bool assertTrue(bool condition, const char* context) {
    if (condition) {
        return true;
    }
    std::cerr << "  Assertion failed [" << context << "]: condition was false\n";
    return false;
}

/**
 * @brief Check if condition is false with logging
 */
inline bool assertFalse(bool condition, const char* context) {
    if (!condition) {
        return true;
    }
    std::cerr << "  Assertion failed [" << context << "]: condition was true\n";
    return false;
}

} // namespace jpegdsp::test
