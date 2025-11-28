# Standard JPEG Test Images

This directory contains standard test images commonly used in JPEG compression research.

## Classic Test Images (USC-SIPI Database)

- **lena_512.png** - Classic "Lena" test image (512×512)
- **peppers_512.png** - Bell peppers with varied colors (512×512)
- **baboon_512.png** - Baboon face with high-frequency detail (512×512)
- **house_512.png** - House exterior (512×512)
- **lake_512.png** - Lake scene (512×512)

Source: USC-SIPI Image Database  
http://sipi.usc.edu/database/

## Kodak PhotoCD Dataset

24 high-quality photographic images (kodim01.png through kodim24.png, 768×512).

Widely used in image compression research as a standard benchmark.

Source: Kodak Lossless True Color Image Suite  
http://r0k.us/graphics/kodak/

## Usage

```powershell
# Encode with analysis
.\build\Debug\jpegdsp_cli_encode.exe --input data/standard_test_images/lena_512.png --output lena.jpg --analyze --html lena_report.html

# Batch encode all images
Get-ChildItem data/standard_test_images/*.png | ForEach-Object {
    $out = "internals/$($_.BaseName).jpg"
    .\build\Debug\jpegdsp_cli_encode.exe --input $_.FullName --output $out --quality 85
}
```

## Citation

If using these images in research:

```
@misc{usc-sipi-database,
  title={The USC-SIPI Image Database},
  author={Signal and Image Processing Institute, University of Southern California},
  url={http://sipi.usc.edu/database/}
}

@misc{kodak-dataset,
  title={Kodak Lossless True Color Image Suite},
  url={http://r0k.us/graphics/kodak/}
}
```
