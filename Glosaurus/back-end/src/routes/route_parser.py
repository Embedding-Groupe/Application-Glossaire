from fastapi import APIRouter, Request
from pathlib import Path
import json
import sys
import os
"""
    Route permettant de parser un fichier donner en paramètre, 
    renvoie un fichier JSON des UL du fichier.
"""
try:
    from src.parser import orchestrator
except ImportError:
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
    from src.parser import orchestrator

router = APIRouter(prefix="/parser", tags=["parser"])

@router.post("/parse")
async def parse(request: Request):
    req = await request.json()
    print("test 1")
    file = req.get("file")
    print("test 2")
    if Path(file).is_file() == False:
        print(f"chemin : {file}")
        return {"error": "File not found"}
    
    result = orchestrator.get_word(file)
    return result