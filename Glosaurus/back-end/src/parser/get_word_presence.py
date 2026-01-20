import json
import sys
import os
from collections import Counter

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

    # Blacklist des mots à ignorer (vide pour le moment)
    BLACKLIST = set()

    # Filtrer les données avant de compter
    # On met tout en minuscule pour regrouper (Receiver == receiver)
    filtered_data = [word.lower() for word in data if word.lower() not in BLACKLIST]

    # Compter les fréquences
    counter = Counter(filtered_data)

    # Convertir en dictionnaire pour la sortie JSON
    # Nous pourrions juste utiliser dict(counter) ou garder l'ordre trié si nous voulons faire sophistiqué,
    # mais les dicts JSON standard sont non ordonnés (bien que Python 3.7+ préserve l'ordre d'insertion).
    # Trions-le par fréquence pour la lisibilité dans le fichier.
    sorted_counts = sorted(counter.items(), key=lambda item: (-item[1], item[0]))
    result_dict = {word: count for word, count in sorted_counts}

    # Écraser le fichier avec le dictionnaire
    with open(target_file, "w", encoding="utf8") as f:
        json.dump(result_dict, f, indent=4, ensure_ascii=False)

    print(f"Successfully wrote word frequencies to {target_file}")

if __name__ == "__main__":
    main()
