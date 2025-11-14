# run_backend.py
from main import app  # Import direct de ton FastAPI
import uvicorn

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
