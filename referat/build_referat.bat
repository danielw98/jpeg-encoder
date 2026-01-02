@echo off
echo Building referat with multiple templates...

cd /d "%~dp0"

set FILES=00_main.md 01_introducere.md 02_fundamente_teoretice.md 03_algoritmul_jpeg.md 04_alte_aplicatii.md 05_proiect_demonstrativ.md 06_concluzii.md 07_bibliografie.md

echo.
echo [1/2] Building with conference-template-a4.docx...
pandoc %FILES% -o referat_conference.docx --reference-doc=conference-template-a4.docx
if %ERRORLEVEL% EQU 0 (
    echo       OK: referat_conference.docx
) else (
    echo       FAILED: conference-template-a4.docx not found or error
)

echo.
echo [2/2] Building with openwork-journal-template.docx...
pandoc %FILES% -o referat_journal.docx --reference-doc=openwork-journal-template.docx
if %ERRORLEVEL% EQU 0 (
    echo       OK: referat_journal.docx
) else (
    echo       FAILED: openwork-journal-template.docx not found or error
)

echo.
echo Done! Opening both files...
start "" "referat_conference.docx"
timeout /t 2 >nul
start "" "referat_journal.docx"
