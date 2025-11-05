from typing import Union
from fastapi import FastAPI, Request
from src.routes import synonym  



app = FastAPI()

app.include_router(synonym.router)




