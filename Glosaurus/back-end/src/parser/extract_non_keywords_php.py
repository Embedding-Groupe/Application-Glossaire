import sys
import os
import json
import tree_sitter_php as tsphp
from tree_sitter import Language, Parser

def main(target_file=None):
    """
    Ce script analyse un fichier PHP spécifié en utilisant `tree-sitter` 
    pour en extraire les éléments non-mots-clés.
    """

    if target_file is None:
        if len(sys.argv) > 1:
            target_file = sys.argv[1]
        else:
            target_file = "test.php"
    
    if not os.path.exists(target_file):
        print(f"File {target_file} not found.")
        return

    try:
        PHP_LANGUAGE = Language(tsphp.language())
        parser = Parser(PHP_LANGUAGE)
    except Exception as e:
        print(f"Error initializing parser: {e}")
        return

    with open(target_file, "rb") as f:
        source_code = f.read()

    tree = parser.parse(source_code)
    root_node = tree.root_node

    non_keywords = []

    def traverse(node):
        if node.type == "name" or node.type == "variable_name":
            # Basic identifier extraction for PHP
             # 1. Function call: verify if current node is the name of function called
            if node.parent and node.parent.type == 'function_call_expression':
                func_node = node.parent.child_by_field_name('function')
                if func_node and func_node.id == node.id:
                    return 

            # 2. Named argument (if applicable in PHP context, though less strict than Python)
            # keeping simple for now
            
            text = source_code[node.start_byte:node.end_byte].decode("utf8")
            # Filter out variable prefixes like '$' if desired, but usually part of identifier in PHP
            if text.startswith("$"):
                text = text[1:]
            
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
