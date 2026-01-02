# Create deployment package for JPEG encoder
Write-Host "Creating deployment package..." -ForegroundColor Cyan

$DEPLOY_DIR = "jpeg-encoder-deploy"
$ZIP_NAME = "jpeg-encoder-deploy.zip"

# Clean up
if (Test-Path $DEPLOY_DIR) { Remove-Item $DEPLOY_DIR -Recurse -Force }
if (Test-Path $ZIP_NAME) { Remove-Item $ZIP_NAME -Force }

# Create structure
New-Item -ItemType Directory -Path $DEPLOY_DIR | Out-Null

# Copy Dockerfile and docker-compose
Copy-Item "deploy\Dockerfile" -Destination "$DEPLOY_DIR\"
Copy-Item "deploy\docker-compose.yml" -Destination "$DEPLOY_DIR\"
if (Test-Path "deploy\README.md") { Copy-Item "deploy\README.md" -Destination "$DEPLOY_DIR\" }

# Copy C++ source
New-Item -ItemType Directory -Path "$DEPLOY_DIR\include" -Force | Out-Null
New-Item -ItemType Directory -Path "$DEPLOY_DIR\src" -Force | Out-Null
New-Item -ItemType Directory -Path "$DEPLOY_DIR\cmake" -Force | Out-Null
New-Item -ItemType Directory -Path "$DEPLOY_DIR\external" -Force | Out-Null

Copy-Item -Path "include\*" -Destination "$DEPLOY_DIR\include" -Recurse
Copy-Item -Path "src\*" -Destination "$DEPLOY_DIR\src" -Recurse
Copy-Item -Path "cmake\*" -Destination "$DEPLOY_DIR\cmake" -Recurse
Copy-Item "external\stb_image.h" -Destination "$DEPLOY_DIR\external\"
Copy-Item "CMakeLists.txt" -Destination "$DEPLOY_DIR\"

# Copy UI source (not node_modules)
New-Item -ItemType Directory -Path "$DEPLOY_DIR\ui\backend\src" -Force | Out-Null
New-Item -ItemType Directory -Path "$DEPLOY_DIR\ui\frontend\src" -Force | Out-Null

Copy-Item -Path "ui\backend\src\*" -Destination "$DEPLOY_DIR\ui\backend\src" -Recurse
Copy-Item "ui\backend\package.json" -Destination "$DEPLOY_DIR\ui\backend\"
if (Test-Path "ui\backend\package-lock.json") { Copy-Item "ui\backend\package-lock.json" -Destination "$DEPLOY_DIR\ui\backend\" }
Copy-Item "ui\backend\tsconfig.json" -Destination "$DEPLOY_DIR\ui\backend\"

Copy-Item -Path "ui\frontend\src\*" -Destination "$DEPLOY_DIR\ui\frontend\src" -Recurse
Copy-Item "ui\frontend\package.json" -Destination "$DEPLOY_DIR\ui\frontend\"
if (Test-Path "ui\frontend\package-lock.json") { Copy-Item "ui\frontend\package-lock.json" -Destination "$DEPLOY_DIR\ui\frontend\" }
Get-ChildItem "ui\frontend\tsconfig*.json" | ForEach-Object { Copy-Item $_.FullName -Destination "$DEPLOY_DIR\ui\frontend\" }
Copy-Item "ui\frontend\vite.config.ts" -Destination "$DEPLOY_DIR\ui\frontend\"
Copy-Item "ui\frontend\index.html" -Destination "$DEPLOY_DIR\ui\frontend\"

# Copy test images
New-Item -ItemType Directory -Path "$DEPLOY_DIR\data\standard_test_images" -Force | Out-Null
Get-ChildItem "data\standard_test_images\*" -Include *.png,*.jpg,*.ppm -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-Item $_.FullName -Destination "$DEPLOY_DIR\data\standard_test_images\"
}

# Create zip (include the folder itself so it extracts to jpeg-encoder-deploy/)
Compress-Archive -Path $DEPLOY_DIR -DestinationPath $ZIP_NAME -Force

# Show result
$zipSize = (Get-Item $ZIP_NAME).Length / 1MB
Write-Host ""
Write-Host "Done! Created $ZIP_NAME ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
Write-Host ""
Write-Host "Transfer to server:" -ForegroundColor Yellow
Write-Host "  scp $ZIP_NAME daniel@danielwagner.ro:~/data/"
Write-Host ""
Write-Host "On server:" -ForegroundColor Yellow
Write-Host "  cd ~/data"
Write-Host "  unzip -o $ZIP_NAME"
Write-Host "  cd $DEPLOY_DIR"
Write-Host "  docker-compose up -d --build"

# Cleanup temp folder
Remove-Item $DEPLOY_DIR -Recurse -Force
