import sys
import os
import json
try:
    from . import extract_non_keywords_python
    from . import extract_non_keywords_java
    from . import split_identifiers
    from . import get_word_presence
except ImportError:
    # Fallback si exécuté en standalone
    import extract_non_keywords_python
    import extract_non_keywords_java
    import split_identifiers
    import get_word_presence

def get_word(input_script):
    """
    Parses a source file and returns the frequency of non-keyword words.
    """
    if not os.path.exists(input_script):
        print(f"Error: File {input_script} not found.")
        return {"error": f"File {input_script} not found."}

    input_script = os.path.abspath(input_script)

    # Détection de l'extension et choix du langage
    _, ext = os.path.splitext(input_script)
    ext = ext.lower()
    
    language = ""
    extractor_module = None
    
    if ext == ".py":
        language = "python"
        extractor_module = extract_non_keywords_python
    elif ext == ".java":
        language = "java"
        extractor_module = extract_non_keywords_java
    else:
        print(f"Error: Unsupported file extension {ext}")
        return {"error": f"Unsupported file extension {ext}"}

    # Construction du nom de fichier de sortie : nom_source_langage.json
    # 1. Extraction
    # print(f"--- Step 1: Extracting non-keywords from {input_script} ({language}) ---")
    extractor_module.main(input_script)
    
    # Le fichier produit par défaut est input_without_ext.json dans le même dossier
    default_json_output = os.path.splitext(input_script)[0] + ".json"
    
    # Le nom souhaite ex : calcultatrice_java.json
    final_json_output = f"{os.path.splitext(input_script)[0]}_{language}.json"
    
    json_output = ""
    if os.path.exists(default_json_output):
        # On renomme
        if os.path.exists(final_json_output):
            os.remove(final_json_output) # On supprime l'ancien s'il existe
        os.rename(default_json_output, final_json_output)
        json_output = final_json_output
    else:
        print(f"Error: Expected output file {default_json_output} was not created.")
        return {"error": f"Expected output file {default_json_output} was not created."}

    # 2. Découpage (Splitting)
    # print(f"--- Step 2: Splitting identifiers in {json_output} ---")
    split_identifiers.main(json_output)

    # 3. Fréquence
    # print(f"--- Step 3: Calculating word frequencies in {json_output} ---")
    get_word_presence.main(json_output)

    # Lire le résultat final pour le retourner
    if os.path.exists(json_output):
        with open(json_output, "r", encoding="utf8") as f:
            try:
                data = json.load(f)
                return data
            except json.JSONDecodeError:
                return {"error": "Failed to decode final JSON output"}
    
    return {"error": "Output file not found after processing"}

def main():
    """
    Script permettant de parser un fichier source et de le traiter pour extraire les mots non-clés.

    Utilisation : python orchestrator.py <path_to_source_file>
    """
    if len(sys.argv) < 2:
        print("Usage: python orchestrator.py <path_to_source_file>")
        return

    input_script = sys.argv[1]
    result = get_word(input_script)
    print(json.dumps(result, indent=4, ensure_ascii=False))

if __name__ == "__main__":
    main()
