# JPEGDSP Web Frontend

Modern Python web UI for the JPEG encoder CLI tool.

## Tech Stack

- **FastAPI** - Modern async web framework with automatic OpenAPI docs
- **Jinja2** - Template engine
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation (via FastAPI)

## Quick Start

```powershell
# From project root
cd ui/web

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py
```

Open http://127.0.0.1:8000 in your browser.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web UI (HTML) |
| `/health` | GET | Health check, CLI status |
| `/api/info` | GET | API configuration info |
| `/api/encode` | POST | Encode image (coming soon) |
| `/docs` | GET | OpenAPI documentation (Swagger UI) |
| `/redoc` | GET | Alternative API docs (ReDoc) |

## Project Structure

```
ui/web/
├── app.py              # FastAPI application
├── requirements.txt    # Python dependencies
├── templates/          # Jinja2 HTML templates
│   └── index.html      # Main page
└── static/             # Static assets (CSS, JS, images)
```

## Development

The server runs with auto-reload enabled. Edit files and save to see changes.

```powershell
# Run with custom port
uvicorn app:app --host 0.0.0.0 --port 8080 --reload
```

## Docker (Coming Soon)

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```
