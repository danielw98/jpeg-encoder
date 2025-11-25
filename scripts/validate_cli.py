#!/usr/bin/env python3
"""
CLI validation script for jpegdsp

Tests the jpegdsp_cli_encode executable with various test images and validates:
1. Output JPEG files are created
2. File size is reasonable (compression is working)
3. Quality scaling works (higher quality = larger files)
4. JSON output is valid
5. JPEG markers are correct (basic format validation)

Run after building: python scripts/validate_cli.py
"""

import os
import sys
import json
import subprocess
from pathlib import Path

# JPEG marker bytes
SOI = b'\xff\xd8'  # Start of Image
EOI = b'\xff\xd9'  # End of Image
APP0 = b'\xff\xe0'  # JFIF Application Segment
DQT = b'\xff\xdb'  # Define Quantization Table
SOF0 = b'\xff\xc0'  # Start of Frame (Baseline DCT)
DHT = b'\xff\xc4'  # Define Huffman Table
SOS = b'\xff\xda'  # Start of Scan

def find_cli_executable():
    """Locate jpegdsp_cli_encode executable"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    # Try different build configurations
    candidates = [
        project_root / "build" / "Debug" / "jpegdsp_cli_encode.exe",
        project_root / "build" / "Release" / "jpegdsp_cli_encode.exe",
        project_root / "build" / "jpegdsp_cli_encode.exe",
    ]
    
    for exe in candidates:
        if exe.exists():
            return exe
    
    return None

def validate_jpeg_markers(filepath):
    """Check if JPEG has required markers"""
    with open(filepath, 'rb') as f:
        data = f.read()
    
    # Must start with SOI and end with EOI
    if not data.startswith(SOI):
        return False, "Missing SOI marker"
    
    if not data.endswith(EOI):
        return False, "Missing EOI marker"
    
    # Check for required JFIF segments
    required = [APP0, DQT, SOF0, DHT, SOS]
    for marker in required:
        if marker not in data:
            return False, f"Missing marker: {marker.hex()}"
    
    return True, "All markers present"

def run_encode_test(exe, input_file, output_file, quality=75, format_type="color_420", use_json=False):
    """Run CLI encoder with specified parameters"""
    cmd = [
        str(exe),
        "--input", str(input_file),
        "--output", str(output_file),
        "--quality", str(quality),
        "--format", format_type
    ]
    
    if use_json:
        cmd.append("--json")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Timeout (30s exceeded)"
    except Exception as e:
        return False, "", str(e)

def test_basic_encoding(exe, test_images_dir, output_dir):
    """Test basic encoding functionality"""
    print("=" * 60)
    print("TEST 1: Basic Encoding")
    print("=" * 60)
    
    test_images = [
        ("solid_red.ppm", "color_420"),
        ("solid_black.ppm", "color_420"),
        ("gradient_horizontal.ppm", "color_420"),
        ("checkerboard_32.ppm", "color_420"),
        ("grayscale_ramp.pgm", "grayscale"),
    ]
    
    passed = 0
    failed = 0
    
    for img, format_type in test_images:
        input_path = test_images_dir / img
        output_path = output_dir / f"{img.rsplit('.', 1)[0]}.jpg"
        
        if not input_path.exists():
            print(f"  ⚠️  SKIP: {img} (input not found)")
            continue
        
        success, stdout, stderr = run_encode_test(exe, input_path, output_path, format_type=format_type)
        
        if success and output_path.exists():
            # Validate JPEG
            valid, msg = validate_jpeg_markers(output_path)
            if valid:
                size_kb = output_path.stat().st_size / 1024
                print(f"  ✅ PASS: {img} → {output_path.name} ({size_kb:.1f} KB)")
                passed += 1
            else:
                print(f"  ❌ FAIL: {img} → Invalid JPEG ({msg})")
                failed += 1
        else:
            print(f"  ❌ FAIL: {img} → {stderr if stderr else 'Unknown error'}")
            failed += 1
    
    print(f"\nResult: {passed} passed, {failed} failed\n")
    return failed == 0

def test_quality_scaling(exe, test_images_dir, output_dir):
    """Test that quality parameter affects file size"""
    print("=" * 60)
    print("TEST 2: Quality Scaling")
    print("=" * 60)
    
    test_image = test_images_dir / "complex_pattern.ppm"
    if not test_image.exists():
        print("  ⚠️  SKIP: complex_pattern.ppm not found\n")
        return True
    
    qualities = [10, 50, 90]
    sizes = []
    
    for q in qualities:
        output_path = output_dir / f"quality_{q}.jpg"
        success, _, _ = run_encode_test(exe, test_image, output_path, quality=q)
        
        if success and output_path.exists():
            size = output_path.stat().st_size
            sizes.append(size)
            print(f"  Quality {q:2d}: {size:6d} bytes ({size / 1024:.1f} KB)")
        else:
            print(f"  ❌ FAIL: Quality {q}")
            return False
    
    # Verify monotonic increase
    if sizes[0] < sizes[1] < sizes[2]:
        print(f"  ✅ PASS: Higher quality → Larger file size\n")
        return True
    else:
        print(f"  ❌ FAIL: Quality scaling not working correctly\n")
        return False

def test_json_output(exe, test_images_dir, output_dir):
    """Test JSON output format"""
    print("=" * 60)
    print("TEST 3: JSON Output")
    print("=" * 60)
    
    test_image = test_images_dir / "gradient_horizontal.ppm"
    if not test_image.exists():
        print("  ⚠️  SKIP: gradient_horizontal.ppm not found\n")
        return True
    
    output_path = output_dir / "json_test.jpg"
    success, stdout, stderr = run_encode_test(exe, test_image, output_path, use_json=True)
    
    if not success:
        print(f"  ❌ FAIL: Encoding failed\n")
        return False
    
    try:
        data = json.loads(stdout)
        
        # Validate required fields
        required_fields = [
            "original_width", "original_height",
            "padded_width", "padded_height",
            "original_bytes", "compressed_bytes",
            "compression_ratio", "quality", "format"
        ]
        
        missing = [f for f in required_fields if f not in data]
        if missing:
            print(f"  ❌ FAIL: Missing JSON fields: {missing}\n")
            return False
        
        print(f"  ✅ PASS: Valid JSON with all fields")
        print(f"    Original: {data['original_width']}×{data['original_height']}")
        print(f"    Compressed: {data['compressed_bytes']} bytes")
        print(f"    Ratio: {data['compression_ratio']:.2f}x\n")
        return True
        
    except json.JSONDecodeError as e:
        print(f"  ❌ FAIL: Invalid JSON: {e}\n")
        return False

def test_error_handling(exe):
    """Test error handling for invalid inputs"""
    print("=" * 60)
    print("TEST 4: Error Handling")
    print("=" * 60)
    
    tests = [
        # (description, args, should_fail)
        ("Missing --input", ["--output", "test.jpg"], True),
        ("Missing --output", ["--input", "test.ppm"], True),
        ("Invalid quality (0)", ["--input", "test.ppm", "--output", "test.jpg", "--quality", "0"], True),
        ("Invalid quality (101)", ["--input", "test.ppm", "--output", "test.jpg", "--quality", "101"], True),
        ("File not found", ["--input", "nonexistent_file.ppm", "--output", "test.jpg"], True),
    ]
    
    passed = 0
    failed = 0
    
    for desc, args, should_fail in tests:
        cmd = [str(exe)] + args
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            did_fail = result.returncode != 0
            
            if did_fail == should_fail:
                print(f"  ✅ PASS: {desc}")
                passed += 1
            else:
                print(f"  ❌ FAIL: {desc} (expected failure={should_fail}, got failure={did_fail})")
                failed += 1
        except Exception as e:
            print(f"  ❌ FAIL: {desc} (exception: {e})")
            failed += 1
    
    print(f"\nResult: {passed} passed, {failed} failed\n")
    return failed == 0

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    test_images_dir = project_root / "data" / "test_images"
    output_dir = project_root / "data" / "test_outputs"
    
    # Find executable
    exe = find_cli_executable()
    if not exe:
        print("❌ ERROR: Could not find jpegdsp_cli_encode.exe")
        print("   Please build the project first: cmake --build build --config Debug")
        sys.exit(1)
    
    print(f"Using CLI: {exe}")
    print(f"Test images: {test_images_dir}")
    print(f"Output directory: {output_dir}")
    print()
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Run test suite
    all_passed = True
    
    all_passed &= test_basic_encoding(exe, test_images_dir, output_dir)
    all_passed &= test_quality_scaling(exe, test_images_dir, output_dir)
    all_passed &= test_json_output(exe, test_images_dir, output_dir)
    all_passed &= test_error_handling(exe)
    
    # Summary
    print("=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    if all_passed:
        print("✅ All tests PASSED")
        sys.exit(0)
    else:
        print("❌ Some tests FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()
