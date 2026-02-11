from fastapi import APIRouter, Request, UploadFile, File
from pathlib import Path
import json
import sys
import os
import shutil
import tempfile

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
async def parse(file: UploadFile = File(...)):
    # Création d'un fichier temporaire avec la même extension que le fichier uploadé
    suffix = Path(file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # Traitement du fichier temporaire
        result = orchestrator.get_word(tmp_path)
        return result
    finally:
        # Suppression du fichier temporaire
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        
        # Suppression des fichiers JSON générés par l'orchestrateur s'ils existent
        # L'orchestrateur génère {base_name}.json et {base_name}_{language}.json
        base_name = os.path.splitext(tmp_path)[0]
        possible_generated_files = [
            base_name + ".json",
            base_name + "_python.json",
            base_name + "_java.json"
        ]
        for gen_file in possible_generated_files:
            if os.path.exists(gen_file):
                os.remove(gen_file)

from pydantic import BaseModel

class DirectoryRequest(BaseModel):
    path: str

@router.post("/parse_directory")
async def parse_directory(request: DirectoryRequest):
    """
    Route permettant de parser un dossier entier.
    Attend un chemin absolu vers le dossier en entrée.
    """
    if not os.path.exists(request.path):
        return {"error": f"Path not found: {request.path}"}
    
    if not os.path.isdir(request.path):
        return {"error": f"Not a directory: {request.path}"}

    result = orchestrator.get_directory_words(request.path)
    return result