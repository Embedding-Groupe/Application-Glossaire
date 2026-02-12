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

# Store for progress: {task_id: {"current": 0, "total": 0, "status": "running"|"completed"|"error"}}
progress_store = {}

@router.get("/progress/{task_id}")
async def get_progress(task_id: str):
    return progress_store.get(task_id, {"status": "not_found"})

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
    task_id: str = None

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

    from fastapi.concurrency import run_in_threadpool

    def update_progress(current, total, message=""):
        if request.task_id:
            progress_store[request.task_id] = {
                "current": current,
                "total": total,
                "status": "running",
                "message": message
            }

    try:
        # Run blocking orchestartor in a separate thread to allow progress polling
        result = await run_in_threadpool(orchestrator.get_directory_words, request.path, progress_callback=update_progress)
        
        if request.task_id:
            progress_store[request.task_id]["status"] = "completed"
            
        return result
    except Exception as e:
        if request.task_id:
            progress_store[request.task_id] = {
                "status": "error",
                "error": str(e)
            }
        return {"error": str(e)}

class GitHubRepoRequest(BaseModel):
    url: str
    task_id: str = None

@router.post("/parse_github")
async def parse_github(request: GitHubRepoRequest):
    """
    Route permettant de parser un repository GitHub public.
    Attend une URL GitHub en entrée.
    """
    try:
        from src.parser import github_cloner
    except ImportError:
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
        from src.parser import github_cloner
    
    # Clone the repository
    # TODO: GitHub cloning progress? separate step?
    if request.task_id:
        progress_store[request.task_id] = {
            "current": 0,
            "total": 0,
            "status": "cloning"
        }

    temp_dir, error = github_cloner.clone_github_repo(request.url)
    
    if error:
        if request.task_id:
             progress_store[request.task_id] = {"status": "error", "error": error}
        return {"error": error}
    
    def update_progress(current, total, message=""):
        if request.task_id:
            progress_store[request.task_id] = {
                "current": current,
                "total": total,
                "status": "running",
                "message": message
            }

    try:
        from fastapi.concurrency import run_in_threadpool
        # Parse the cloned directory
        result = await run_in_threadpool(orchestrator.get_directory_words, temp_dir, progress_callback=update_progress)
        
        if request.task_id:
            progress_store[request.task_id]["status"] = "completed"

        return result
    except Exception as e:
        if request.task_id:
            progress_store[request.task_id] = {
                "status": "error",
                "error": str(e)
            }
        return {"error": str(e)}
    finally:
        # Always cleanup the temporary directory
        github_cloner.cleanup_temp_directory(temp_dir)