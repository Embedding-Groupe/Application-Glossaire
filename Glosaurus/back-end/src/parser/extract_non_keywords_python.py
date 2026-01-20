import sys
import os
import json
import tree_sitter_python as tspython
from tree_sitter import Language, Parser

def main(target_file=None):
    """
    Ce script analyse un fichier Python spécifié en utilisant `tree-sitter` 
    pour en extraire les éléments non-mots-clés. Il identifie les identifiants, 
    les chaînes de caractères, les entiers, les flottants, les booléens et `None`.
    Les éléments extraits sont ensuite sauvegardés dans un fichier JSON 
    portant le même nom que le fichier source, avec une extension `.json`.    
    """

    # permet l'appel du script en ligne de commande
    # inutile si on lance seulement depuis l'orchestrator, à garder pour les test unitaire.
    if target_file is None:
        if len(sys.argv) > 1:
            target_file = sys.argv[1]
        else:
            target_file = "test.py"
    
    if not os.path.exists(target_file):
        print(f"File {target_file} not found.")
        return

    try:
        # ajout d'un langage dans cette partie.
        PY_LANGUAGE = Language(tspython.language())
        parser = Parser(PY_LANGUAGE)
    except Exception as e:
        print(f"Error initializing parser: {e}")
        return

    with open(target_file, "rb") as f:
        source_code = f.read()

    tree = parser.parse(source_code)
    root_node = tree.root_node

    non_keywords = []
    
    # Types à conserver
    KEEP_TYPES = {
        "identifier",
    }

    def traverse(node):
        """
        Fonction de parcours du parse tree.
        """        
        if node.type == "identifier":
            # les identifiants sont les mots non-clés, mais aussi les fonctions 
            # de transformations de types (int, float, bool, None).
            # On regarde donc le contexte de l'appel pour ne pas les récupérer.
            
            # 1. Appel de fonction : ignorer si c'est une fonction appelée
            if node.parent and node.parent.type == 'call':
                func_node = node.parent.child_by_field_name('function')
                if func_node and func_node.id == node.id:
                    return # Ignorer l'identifiant (c'est le nom de la fonction appelée)

            # 2. Argument clé/valeur : ignorer si c'est le nom de l'argument
            if node.parent and node.parent.type == 'keyword_argument':
                 name_node = node.parent.child_by_field_name('name')
                 if name_node and name_node.id == node.id:
                     return # Ignorer l'identifiant (c'est le nom de l'argument)
            
            # Si on passe les filtres, on garde l'identifiant
            text = source_code[node.start_byte:node.end_byte].decode("utf8")
            non_keywords.append(text)
        
        for child in node.children:
            traverse(child)

    traverse(root_node)

    output_filename = os.path.splitext(target_file)[0] + ".json"
    
    with open(output_filename, "w", encoding="utf8") as f:
        json.dump(non_keywords, f, indent=4, ensure_ascii=False)
        
    print(f"Successfully extracted {len(non_keywords)} items to {output_filename}")

if __name__ == "__main__":
    main()