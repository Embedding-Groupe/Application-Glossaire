import sys
import os
import json

# Imports relatifs (quand utilisé comme module)
try:
    from . import extract_non_keywords_python
    from . import extract_non_keywords_java
    from . import extract_non_keywords_php
    from . import extract_non_keywords_javascript
    from . import extract_non_keywords_typescript
    from . import split_identifiers
    from . import get_word_presence
except ImportError:
    # Imports absolus (exécution standalone)
    import extract_non_keywords_python
    import extract_non_keywords_java
    import extract_non_keywords_php
    import extract_non_keywords_javascript
    import extract_non_keywords_typescript
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
    elif ext == ".php":
        language = "php"
        extractor = extract_non_keywords_php
    elif ext == ".js":
        language = "javascript"
        extractor = extract_non_keywords_javascript
    elif ext == ".ts":
        language = "typescript"
        extractor = extract_non_keywords_typescript
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


def get_directory_words(directory_path: str, progress_callback=None):
    """
    Analyse récursivement un dossier pour trouver les fichiers .java et .py,
    les parse, et agrège les résultats.

    progress_callback: function(current, total) -> void

    Retour attendu :
    {
        "word": {
            "total_occurrences": int,
            "file_count": int,
            "files": [
                {"name": "filename", "count": int},
                ...
            ]
        },
        ...
    }
    """
    if not os.path.isdir(directory_path):
        return {"error": f"Directory not found: {directory_path}"}

    aggregated_results = {}

    # 1. Count total files to parse
    total_files = 0
    files_to_process = []
    
    for root, _, files in os.walk(directory_path):
        for file in files:
            _, ext = os.path.splitext(file)
            if ext.lower() in ['.py', '.java', '.php', '.js', '.ts']:
                total_files += 1
                files_to_process.append(os.path.join(root, file))

    processed_count = 0
    if progress_callback:
        progress_callback(0, total_files)

    for file_path in files_to_process:
        _, ext = os.path.splitext(file_path)
            
        if True: # Key check already done in collection loop
            # Parse individual file
            file_result = get_word(file_path)
            
            processed_count += 1
            if progress_callback:
                progress_callback(processed_count, total_files)
            
            # Cleanup generated JSON files
                base_name = os.path.splitext(file_path)[0]
                _, ext = os.path.splitext(file_path)
                
                language = "python"
                if ext.lower() == ".java": language = "java"
                elif ext.lower() == ".php": language = "php"
                elif ext.lower() == ".js": language = "javascript"
                elif ext.lower() == ".ts": language = "typescript"

                final_json = f"{base_name}_{language}.json"
                default_json = base_name + ".json"
                
                if os.path.exists(final_json):
                    os.remove(final_json)
                if os.path.exists(default_json):
                    os.remove(default_json)

                if "error" in file_result:
                    print(f"Error parsing {file_path}: {file_result['error']}")
                    continue
                
                # Aggregate results
                # file_result is { "word": count, ... }
                for word, count in file_result.items():
                    if word not in aggregated_results:
                        aggregated_results[word] = {
                            "total_occurrences": 0,
                            "file_count": 0,
                            "files": []
                        }
                    
                    aggregated_results[word]["total_occurrences"] += count
                    aggregated_results[word]["file_count"] += 1
                    aggregated_results[word]["files"].append({
                        "name": os.path.basename(file_path),
                        "count": count
                    })

    return aggregated_results


def main():
    """
    Exécution en ligne de commande :

    python orchestrator.py <path_to_source_file_or_directory>
    """
    if len(sys.argv) < 2:
        print("Usage: python orchestrator.py <path_to_source_file_or_directory>")
        sys.exit(1)

    input_path = sys.argv[1]
    
    if os.path.isdir(input_path):
        result = get_directory_words(input_path)
    else:
        result = get_word(input_path)

    print(json.dumps(result, indent=4, ensure_ascii=False))


if __name__ == "__main__":
    main()
