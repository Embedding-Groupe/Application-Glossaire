from fastapi import APIRouter, Request
import json
from src.ia_contexte.ia_suggestion import ia_suggestion


router = APIRouter(prefix="/suggestions", tags=["suggestions"])

lm = ia_suggestion()

@router.post("/getSynonym")
async def getSynonym(request: Request):
    req = await request.json()
    word = req.get("word")
    synonyms = req.get("synonyms")
    definition = req.get("definition")
    glossary_name = req.get("glossary_name")
    glossary_description = req.get("glossary_description")
    bounded_context = req.get("bounded_context")

    print(f"Request for word: {word}")
    print(f"synonyms: {synonyms}")
    print(f"definition: {definition}")
    print(f"glossary_name: {glossary_name}")
    print(f"glossary_description: {glossary_description}")
    print(f"bounded_context: {bounded_context}")
    

    suggestion_synonyms = lm.getSynonyms(
        word, 
        definition, 
        synonyms, 
        glossary_name=glossary_name, 
        glossary_description=glossary_description, 
        bounded_context=bounded_context
    )

    if suggestion_synonyms is None:
        return {"synonyms" : []}
    print(suggestion_synonyms.split(","))

    return {"synonyms" : suggestion_synonyms.split(",")}

