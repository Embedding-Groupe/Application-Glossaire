from fastapi import APIRouter, Request
from src.resyf_package.resyf import load_resource, getSynonyms
import json
from src.ia_contexte.miniLM import miniLM

lexicalRes = load_resource()
miniLM_instance = miniLM()

router = APIRouter(prefix="/synonym", tags=["synonyms"])

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


    unordered_synonyms = getSynonyms(lexicalRes, word)
    ordered_synonyms = miniLM_instance.getOrderedSynonyms(unordered_synonyms, context)

    return {"synonyms" : ordered_synonyms}


"""
récupérer les mots ajouter par les utilisateurs 
puis les envoyer a l'ia pour avoir leur proximité sémantique et leur attribuer leur couleur.
"""