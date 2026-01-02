"""
JPEGDSP Web Frontend - FastAPI Application

Modern Python web UI for the JPEG encoder CLI tool.
"""

from __future__ import annotations

import asyncio
import subprocess
import tempfile
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

@dataclass(frozen=True)
class AppConfig:
    """Application configuration (immutable)."""
    
    app_name: str = "JPEGDSP Web Encoder"
    app_version: str = "0.1.0"
    
    # Path to CLI encoder (relative to project root)
    cli_path: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "build" / "Debug" / "jpegdsp_cli_encode.exe")
    
    # Upload constraints
    max_upload_size_mb: int = 50
    allowed_extensions: frozenset[str] = frozenset({".png", ".ppm", ".pgm"})
    
    # Quality range
    min_quality: int = 1
    max_quality: int = 100
    default_quality: int = 75


class EncodingFormat(str, Enum):
    """JPEG encoding format options."""
    
    GRAYSCALE = "grayscale"
    COLOR_420 = "color_420"


# -----------------------------------------------------------------------------
# Data Models
# -----------------------------------------------------------------------------

@dataclass
class EncodingResult:
    """Result of a JPEG encoding operation."""
    
    success: bool
    input_filename: str
    output_path: Path | None = None
    
    # Encoding stats
    original_width: int = 0
    original_height: int = 0
    original_bytes: int = 0
    compressed_bytes: int = 0
    compression_ratio: float = 0.0
    quality: int = 75
    format: EncodingFormat = EncodingFormat.COLOR_420
    
    # Timing
    encoding_time_ms: float = 0.0
    timestamp: datetime = field(default_factory=datetime.now)
    
    # Error info
    error_message: str | None = None
    
    @property
    def space_savings_percent(self) -> float:
        """Calculate percentage of space saved."""
        if self.original_bytes == 0:
            return 0.0
        return (1 - self.compressed_bytes / self.original_bytes) * 100


@dataclass
class EncodingRequest:
    """Request parameters for encoding."""
    
    quality: int = 75
    format: EncodingFormat = EncodingFormat.COLOR_420
    
    def __post_init__(self) -> None:
        """Validate quality range."""
        if not 1 <= self.quality <= 100:
            raise ValueError(f"Quality must be 1-100, got {self.quality}")


# -----------------------------------------------------------------------------
# Application Setup
# -----------------------------------------------------------------------------

config = AppConfig()

app = FastAPI(
    title=config.app_name,
    version=config.app_version,
    description="Web interface for the JPEGDSP baseline JPEG encoder",
)

# Templates directory (create if needed)
templates_dir = Path(__file__).parent / "templates"
templates_dir.mkdir(exist_ok=True)

templates = Jinja2Templates(directory=str(templates_dir))

# Static files directory
static_dir = Path(__file__).parent / "static"
static_dir.mkdir(exist_ok=True)

if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    """Render the main page."""
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "config": config,
            "formats": list(EncodingFormat),
        },
    )


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    cli_exists = config.cli_path.exists()
    return {
        "status": "healthy" if cli_exists else "degraded",
        "app": config.app_name,
        "version": config.app_version,
        "cli_available": str(cli_exists),
        "cli_path": str(config.cli_path),
    }


@app.get("/api/info")
async def api_info() -> dict[str, str | int | list[str]]:
    """Get API information and constraints."""
    return {
        "app_name": config.app_name,
        "version": config.app_version,
        "max_upload_size_mb": config.max_upload_size_mb,
        "allowed_extensions": sorted(config.allowed_extensions),
        "quality_range": [config.min_quality, config.max_quality],
        "default_quality": config.default_quality,
        "formats": [f.value for f in EncodingFormat],
    }


# -----------------------------------------------------------------------------
# Entry Point
# -----------------------------------------------------------------------------

def main() -> None:
    """Run the development server."""
    import uvicorn
    
    print(f"\n{'='*60}")
    print(f"  {config.app_name} v{config.app_version}")
    print(f"{'='*60}")
    print(f"  CLI encoder: {config.cli_path}")
    print(f"  CLI exists:  {config.cli_path.exists()}")
    print(f"{'='*60}\n")
    
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=[str(Path(__file__).parent)],
    )


if __name__ == "__main__":
    main()
