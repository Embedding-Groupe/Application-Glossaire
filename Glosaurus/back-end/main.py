from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import synonym

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
       "http://localhost",
        "http://localhost:80",
        "http://localhost:8000",
        "http://127.0.0.1",
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "http://127.0.0.1:80",
        "http://127.0.0.1:8000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "tauri://localhost"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(synonym.router)
