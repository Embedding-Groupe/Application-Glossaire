import json
import re
import sys
import os

def split_identifier(identifier):
    """
    1. Remplacer les séparateurs (_ et -) par des espaces
    2. Insérer un espace avant les majuscules qui suivent des minuscules (CamelCase)
    3. Séparer par les espaces
    """

    text = re.sub(r'[_\-]+', ' ', identifier)
    
    # Supprimer les chiffres (remplacer par espace pour séparer les mots collés aux chiffres)
    # ex : "player1Score" -> "player Score"
    # text = re.sub(r'\d+', ' ', text)

    # Gérer le CamelCase : insérer un espace entre une minuscule et une majuscule
    # ex : "CalculatriceCassio" -> "Calculatrice Cassio"
    # ex : "maVar" -> "ma Var"
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    
    # On pourrait aussi vouloir gérer les majuscules consécutives comme "HTTPServer" -> "HTTP Server"
    # Mais généralement, ce qui précède suffit pour les cas simples.
    # Ajoutons la gestion de "HTTP" suivi de "Server" -> "HTTP" "Server" (optionnel, mais utile)
    text = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1 \2', text)

    # Séparer par les espaces
    words = [w for w in text.split(' ') if w]
    return words

def main(target_file=None):
    if target_file is None:
        if len(sys.argv) > 1:
            target_file = sys.argv[1]
        else:
            target_file = "test.json"

    if not os.path.exists(target_file):
        print(f"File {target_file} not found.")
        return

    try:
        with open(target_file, "r", encoding="utf8") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {target_file}")
        return

    if not isinstance(data, list):
        print("Expected JSON content to be a list.")
        return

    new_list = []
    for item in data:
        if isinstance(item, str):
            words = split_identifier(item)
            new_list.extend(words)
        else:
            # Si pour une raison quelconque ce n'est pas une chaîne, on garde ou on ignore ?
            # Gardons les éléments qui ne sont pas des chaînes (peu probable d'après le script précédent)
            new_list.append(item)
            

    # On ré-écrit le fichier
    with open(target_file, "w", encoding="utf8") as f:
        json.dump(new_list, f, indent=4, ensure_ascii=False)

    print(f"Successfully processed identifiers in {target_file}. New count: {len(new_list)}")

if __name__ == "__main__":
    main()
