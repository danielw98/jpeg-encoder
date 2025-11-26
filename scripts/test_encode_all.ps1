#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Batch encode all test images with analysis reports
    
.DESCRIPTION
    Encodes all PNG images from standard_test_images folder at multiple quality levels,
    generates analysis reports (JSON + HTML), and compares results.
    
.PARAMETER Quality
    JPEG quality level (10-95). Default: 75
    
.PARAMETER OutputDir
    Output directory for encoded JPEGs. Default: internals/test_results
    
.EXAMPLE
    .\scripts\test_encode_all.ps1
    .\scripts\test_encode_all.ps1 -Quality 90
    .\scripts\test_encode_all.ps1 -Quality 85 -OutputDir output/quality85
#>

param(
    [int]$Quality = 75,
    [string]$OutputDir = "internals/test_results"
)

$ErrorActionPreference = "Stop"

# Paths
$RootDir = Split-Path -Parent $PSScriptRoot
$EncoderExe = Join-Path $RootDir "build\Debug\jpegdsp_cli_encode.exe"
$TestImagesDir = Join-Path $RootDir "data\standard_test_images"
$OutputPath = Join-Path $RootDir $OutputDir

# Validate
if (-not (Test-Path $EncoderExe))
{
    Write-Error "Encoder not found: $EncoderExe`nRun: cmake --build build --config Debug"
    exit 1
}

if (-not (Test-Path $TestImagesDir))
{
    Write-Error "Test images not found: $TestImagesDir`nRun: python scripts\download_test_images.py"
    exit 1
}

# Create output directory
New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host " JPEGDSP Batch Encoder - Quality $Quality" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""

# Get all PNG test images
$Images = Get-ChildItem -Path $TestImagesDir -Filter *.png | Sort-Object Name

if ($Images.Count -eq 0)
{
    Write-Error "No PNG images found in $TestImagesDir"
    exit 1
}

Write-Host "Found $($Images.Count) test images" -ForegroundColor Green
Write-Host "Output directory: $OutputPath" -ForegroundColor Gray
Write-Host ""

# Statistics
$TotalImages = $Images.Count
$SuccessCount = 0
$FailCount = 0
$TotalOriginalSize = 0
$TotalCompressedSize = 0

# Process each image
foreach ($Image in $Images)
{
    $BaseName = [System.IO.Path]::GetFileNameWithoutExtension($Image.Name)
    $OutputJpeg = Join-Path $OutputPath "$BaseName`_q$Quality.jpg"
    $OutputJson = Join-Path $OutputPath "$BaseName`_q$Quality.json"
    $OutputHtml = Join-Path $OutputPath "$BaseName`_q$Quality.html"
    
    Write-Host "[$(($Images.IndexOf($Image) + 1).ToString().PadLeft(2))/$TotalImages] " -NoNewline -ForegroundColor Cyan
    Write-Host "$($Image.Name.PadRight(25))" -NoNewline
    
    try
    {
        # Encode with analysis (capture JSON from stdout)
        $JsonOutput = & $EncoderExe `
            --input $Image.FullName `
            --output $OutputJpeg `
            --quality $Quality `
            --analyze `
            --html $OutputHtml `
            --json 2>&1
        
        if ($LASTEXITCODE -eq 0)
        {
            # Save JSON to file
            $JsonOutput | Out-File -FilePath $OutputJson -Encoding utf8
            
            # Get file sizes
            $OriginalSize = $Image.Length
            $CompressedSize = (Get-Item $OutputJpeg).Length
            $Ratio = [math]::Round($OriginalSize / $CompressedSize, 2)
            
            $TotalOriginalSize += $OriginalSize
            $TotalCompressedSize += $CompressedSize
            $SuccessCount++
            
            Write-Host " → " -NoNewline -ForegroundColor Gray
            Write-Host "$([math]::Round($OriginalSize / 1KB, 1))KB" -NoNewline -ForegroundColor Gray
            Write-Host " → " -NoNewline -ForegroundColor Gray
            Write-Host "$([math]::Round($CompressedSize / 1KB, 1))KB" -NoNewline -ForegroundColor Green
            Write-Host " (" -NoNewline -ForegroundColor Gray
            Write-Host "$($Ratio)x" -NoNewline -ForegroundColor Yellow
            Write-Host ")" -ForegroundColor Gray
        }
        else
        {
            Write-Host " [FAILED] $JsonOutput" -ForegroundColor Red
            $FailCount++
        }
    }
    catch
    {
        Write-Host " [ERROR] $_" -ForegroundColor Red
        $FailCount++
    }
}

# Summary
Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host " Summary" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""
Write-Host "Total images:       " -NoNewline; Write-Host $TotalImages -ForegroundColor White
Write-Host "Successful:         " -NoNewline; Write-Host $SuccessCount -ForegroundColor Green
Write-Host "Failed:             " -NoNewline; Write-Host $FailCount -ForegroundColor $(if ($FailCount -eq 0) { "Green" } else { "Red" })
Write-Host ""
Write-Host "Total original:     " -NoNewline; Write-Host "$([math]::Round($TotalOriginalSize / 1MB, 2)) MB" -ForegroundColor White
Write-Host "Total compressed:   " -NoNewline; Write-Host "$([math]::Round($TotalCompressedSize / 1MB, 2)) MB" -ForegroundColor Green
Write-Host "Average ratio:      " -NoNewline; Write-Host "$([math]::Round($TotalOriginalSize / $TotalCompressedSize, 2))x" -ForegroundColor Yellow
Write-Host ""
Write-Host "Output directory:   " -NoNewline; Write-Host $OutputPath -ForegroundColor Cyan
Write-Host ""

# Exit code
exit $(if ($FailCount -eq 0) { 0 } else { 1 })
