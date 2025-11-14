from fastapi import APIRouter, Request
import json
from src.ia_contexte.miniLM import miniLM


router = APIRouter(prefix="/synonym", tags=["synonyms"])

lm = miniLM()

@router.post("/getSynonym")
async def getSynonym(request: Request):
    """
    envoyer le mot a Resyf pour avoir une liste de synonymes.
    envoyer les mots du contexte et la liste de synonymes a l'ia pour choisir les meilleurs synonymes.
    récupérer dans une liste les synonymes ayant un taux de pertinence superieur a un certain seuil 
    puis envoyer cette liste en reponse à l'application.
    """
    req = await request.json()
    word = req.get("word")
    synonyms = req.get("synonyms")
    print(synonyms)
    context = synonyms
    context.append(word)
    print(context)


    suggestion_synonyms = lm.getSynonyms(word, context)
    print(suggestion_synonyms.split(","))

    return {"synonyms" : suggestion_synonyms.split(",")}


"""
récupérer les mots ajouter par les utilisateurs 
puis les envoyer a l'ia pour avoir leur proximité sémantique et leur attribuer leur couleur.
"""