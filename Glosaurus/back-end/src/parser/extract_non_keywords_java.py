import sys
import os
import json
import tree_sitter_java as tsjava
from tree_sitter import Language, Parser

def main(target_file=None):
    """
    Ce script analyse un fichier Java spécifié en utilisant `tree-sitter` 
    pour en extraire les éléments non-mots-clés. Il ignore les appels de méthodes.
    """

    if target_file is None:
        if len(sys.argv) > 1:
            target_file = sys.argv[1]
        else:
            target_file = "Test.java"
    
    if not os.path.exists(target_file):
        print(f"File {target_file} not found.")
        return

    try:
        JAVA_LANGUAGE = Language(tsjava.language())
        parser = Parser(JAVA_LANGUAGE)
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
        if node.type == "string_literal": 
             # En Java c'est souvent string_literal
            return 
        
        if node.type == "identifier":
            # Filtrage contextuel pour Java
            
            # 1. Appel de méthode (Method Invocation)
            if node.parent and node.parent.type == 'method_invocation':
                name_node = node.parent.child_by_field_name('name')
                if name_node and name_node.id == node.id:
                    return

            # 2. Paramètres d'annotation (pair key=value)
            if node.parent and node.parent.type == 'element_value_pair':
                key_node = node.parent.child_by_field_name('key')
                if key_node and key_node.id == node.id:
                     return

            # 3. Ignorer 'System' et 'out' dans System.out.println
            if node.parent and node.parent.type == 'field_access':
                # voir pour ajouter d'autre filtre plus tard, on va tester avec les katha d'abords.
                text_val = source_code[node.start_byte:node.end_byte].decode("utf8")
                if text_val in ["System", "out"]:
                    return

            # 4. Ignorer les arguments de la fonction 'main' (ex: args)
            if node.parent and node.parent.type == 'formal_parameter':
                p = node.parent
                while p:
                    if p.type == 'method_declaration':
                         name_child = p.child_by_field_name('name')
                         if name_child:
                             func_name = source_code[name_child.start_byte:name_child.end_byte].decode("utf8")
                             if func_name == "main":
                                 return # On est dans les paramètres de main
                         break
                    p = p.parent

            # 5. Ignorer tout ce qui est dans une annotation, un import ou un package (@, from, ...)
            # On remonte l'arbre pour voir si on est descendant d'un tel nœud
            p = node.parent
            while p:
                if p.type in ['marker_annotation', 'annotation', 'single_element_annotation', 'modifiers']:
                    return
                if p.type in ['package_declaration', 'import_declaration']:
                    return
                p = p.parent

            # Si on passe les filtres
            text = source_code[node.start_byte:node.end_byte].decode("utf8")
            non_keywords.append(text)
        
        for child in node.children:
            traverse(child)

    traverse(root_node)
    
    # Ici on garde la logique "interne" simple pour le standalone:
    output_filename = os.path.splitext(target_file)[0] + ".json"
    
    with open(output_filename, "w", encoding="utf8") as f:
        json.dump(non_keywords, f, indent=4, ensure_ascii=False)
        
    print(f"Successfully extracted {len(non_keywords)} items to {output_filename}")

if __name__ == "__main__":
    main()
