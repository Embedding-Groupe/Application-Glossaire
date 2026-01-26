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
    # Create a temporary file with the same extension as the uploaded file
    suffix = Path(file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # Process the temporary file
        result = orchestrator.get_word(tmp_path)
        return result
    finally:
        # Cleanup: Remove the temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        
        # Cleanup: Remove generated JSON files by orchestrator if they exist
        # The orchestrator generates {base_name}.json and {base_name}_{language}.json
        base_name = os.path.splitext(tmp_path)[0]
        possible_generated_files = [
            base_name + ".json",
            base_name + "_python.json",
            base_name + "_java.json"
        ]
        for gen_file in possible_generated_files:
            if os.path.exists(gen_file):
                os.remove(gen_file)