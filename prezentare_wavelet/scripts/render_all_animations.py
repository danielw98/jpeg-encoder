"""
Render all Manim animations for the presentation.

Usage:
    python render_all_animations.py [--quality low|medium|high]
"""
import subprocess
import sys
from pathlib import Path
import argparse


# Define all scenes to render
SCENES = [
    ("scene_fourier_vs_wavelet.py", ["FourierVsWavelet", "STFTSpectrogram", "WaveletScaling"]),
    ("scene_mallat_decomposition.py", ["MallatDecomposition", "FilterBank"]),
    ("scene_denoising.py", ["WaveletDenoising", "ThresholdComparison"]),
]

QUALITY_FLAGS = {
    "low": "-pql",      # 480p, 15fps
    "medium": "-pqm",   # 720p, 30fps  
    "high": "-pqh",     # 1080p, 60fps
    "4k": "-pqk",       # 4K, 60fps
}


def render_scene(animation_dir: Path, filename: str, scene_name: str, quality: str):
    """Render a single Manim scene"""
    quality_flag = QUALITY_FLAGS.get(quality, "-pql")
    filepath = animation_dir / filename
    
    cmd = ["manim", quality_flag, str(filepath), scene_name]
    print(f"\n{'='*60}")
    print(f"Rendering: {filename} -> {scene_name}")
    print(f"Command: {' '.join(cmd)}")
    print('='*60)
    
    result = subprocess.run(cmd, capture_output=False)
    
    if result.returncode != 0:
        print(f"ERROR: Failed to render {scene_name}")
        return False
    
    print(f"SUCCESS: {scene_name} rendered")
    return True


def main():
    parser = argparse.ArgumentParser(description="Render all Manim animations")
    parser.add_argument(
        "--quality", "-q",
        choices=["low", "medium", "high", "4k"],
        default="medium",
        help="Rendering quality (default: medium)"
    )
    parser.add_argument(
        "--scene", "-s",
        help="Render only a specific scene (e.g., 'FourierVsWavelet')"
    )
    args = parser.parse_args()
    
    # Get animation directory
    script_dir = Path(__file__).parent
    animation_dir = script_dir.parent / "animations"
    
    if not animation_dir.exists():
        print(f"ERROR: Animation directory not found: {animation_dir}")
        sys.exit(1)
    
    print(f"Animation directory: {animation_dir}")
    print(f"Quality: {args.quality}")
    
    success_count = 0
    fail_count = 0
    
    for filename, scene_names in SCENES:
        for scene_name in scene_names:
            # Skip if specific scene requested and this isn't it
            if args.scene and args.scene != scene_name:
                continue
                
            if render_scene(animation_dir, filename, scene_name, args.quality):
                success_count += 1
            else:
                fail_count += 1
    
    print(f"\n{'='*60}")
    print(f"SUMMARY: {success_count} succeeded, {fail_count} failed")
    print('='*60)
    
    if fail_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
