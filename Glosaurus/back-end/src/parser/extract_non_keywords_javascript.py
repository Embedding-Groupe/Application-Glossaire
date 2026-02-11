import sys
import os
import json
import tree_sitter_javascript as tsjavascript
from tree_sitter import Language, Parser

def main(target_file=None):
    """
    Ce script analyse un fichier JavaScript spécifié en utilisant `tree-sitter` 
    pour en extraire les éléments non-mots-clés.
    """

    if target_file is None:
        if len(sys.argv) > 1:
            target_file = sys.argv[1]
        else:
            target_file = "test.js"
    
    if not os.path.exists(target_file):
        print(f"File {target_file} not found.")
        return

    try:
        JS_LANGUAGE = Language(tsjavascript.language())
        parser = Parser(JS_LANGUAGE)
    except Exception as e:
        print(f"Error initializing parser: {e}")
        return

    with open(target_file, "rb") as f:
        source_code = f.read()

    tree = parser.parse(source_code)
    root_node = tree.root_node

    non_keywords = []

    def traverse(node):
        if node.type == "identifier" or node.type == "property_identifier":
            # 1. Call expression: ignore function name being called
            if node.parent and node.parent.type == 'call_expression':
                func_node = node.parent.child_by_field_name('function')
                if func_node and func_node.id == node.id:
                    return 

            # 2. Member expression: property access
            # e.g. console.log -> log is property_identifier. We might want to keep it or ignore it.
            # For now, let's keep all identifiers unless it's strictly a reserved word (keyword)
            
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
