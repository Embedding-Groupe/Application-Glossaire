import sys
import os
import json

# Imports relatifs (quand utilisé comme module)
try:
    from . import extract_non_keywords_python
    from . import extract_non_keywords_java
    from . import split_identifiers
    from . import get_word_presence
except ImportError:
    # Imports absolus (exécution standalone)
    import extract_non_keywords_python
    import extract_non_keywords_java
    import split_identifiers
    import get_word_presence


def get_word(input_script: str):
    """
    Analyse un fichier source (Python ou Java) et retourne
    la fréquence des mots non-clés sous forme de dictionnaire.

    Retour attendu :
    {
        "mot": occurrence,
        ...
    }
    """

    # ---------- 1. Vérifications ----------
    if not input_script:
        return {"error": "No input file provided"}

    if not os.path.exists(input_script):
        return {"error": f"File not found: {input_script}"}

    input_script = os.path.abspath(input_script)

    # ---------- 2. Détection du langage ----------
    _, ext = os.path.splitext(input_script)
    ext = ext.lower()

    if ext == ".py":
        language = "python"
        extractor = extract_non_keywords_python
    elif ext == ".java":
        language = "java"
        extractor = extract_non_keywords_java
    else:
        return {"error": f"Unsupported file extension: {ext}"}

    # ---------- 3. Étape 1 : Extraction ----------
    # Produit un fichier JSON temporaire : input_script.json
    try:
        extractor.main(input_script)
    except Exception as e:
        return {"error": f"Extraction failed: {str(e)}"}

    base_name = os.path.splitext(input_script)[0]
    default_json = base_name + ".json"
    final_json = f"{base_name}_{language}.json"

    if not os.path.exists(default_json):
        return {"error": "Extraction did not produce expected JSON file"}

    # Renommage du fichier
    if os.path.exists(final_json):
        os.remove(final_json)
    os.rename(default_json, final_json)

    # ---------- 4. Étape 2 : Découpage des identifiants ----------
    try:
        split_identifiers.main(final_json)
    except Exception as e:
        return {"error": f"Identifier splitting failed: {str(e)}"}

    # ---------- 5. Étape 3 : Calcul des fréquences ----------
    try:
        get_word_presence.main(final_json)
    except Exception as e:
        return {"error": f"Word frequency calculation failed: {str(e)}"}

    # ---------- 6. Lecture du résultat final ----------
    if not os.path.exists(final_json):
        return {"error": "Final JSON file not found"}

    try:
        with open(final_json, "r", encoding="utf8") as f:
            data = json.load(f)
            return data
    except json.JSONDecodeError:
        return {"error": "Failed to decode final JSON file"}


def main():
    """
    Exécution en ligne de commande :

    python orchestrator.py <path_to_source_file>
    """
    if len(sys.argv) < 2:
        print("Usage: python orchestrator.py <path_to_source_file>")
        sys.exit(1)

    input_script = sys.argv[1]
    result = get_word(input_script)

    print(json.dumps(result, indent=4, ensure_ascii=False))


if __name__ == "__main__":
    main()
