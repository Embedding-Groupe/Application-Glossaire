class Tableau:
    """
    Permet de créer un fichier .md contenant un tableau, le nombre de lignes et de colonnes sont choisis
    
    """

    def __init__(self, colonnes):
        self.lignes = 0
        self.colonnes = colonnes
        self.headers = [f"Colonne {i+1}" for i in range(colonnes)]
        self.data = [["" for _ in range(colonnes)] for _ in range(self.lignes)]

    def set_header(self, noms):
        """
        entrée : self: Tableau, noms : list["str"]
        sortie : Définie les en-têtes du tableau
        """
        if len(noms) != self.colonnes:
            raise ValueError("Le nombre de noms de colonnes doit correspondre au nombre de colonnes.")
        self.headers = noms

    def add_line(self, valeurs):
        """
        entrée : self: Tableau, valeurs : valeur ou list[str]
        sortie : rajoute une ligne au tableau
        """
        if len(valeurs) != self.colonnes:
            raise ValueError("Le nombre de valeurs doit correspondre au nombre de colonnes.")
        
        ligne_formatee = []
        for valeur in valeurs:
            if isinstance(valeur, list):  # Si la valeur est une liste
                valeur = ", ".join(map(str, valeur))  # Convertit en texte "a, b, c"
            ligne_formatee.append(str(valeur))
        
        self.data.append(ligne_formatee)


    def to_markdown(self):
        """
        sortie: Génère le tableau en format Markdown.
        """
        lignes_md = []
        # Ligne d'en-tête
        lignes_md.append("| " + " | ".join(self.headers) + " |")
        # Ligne de séparation
        lignes_md.append("| " + " | ".join(["---"] * self.colonnes) + " |")
        # Contenu
        for ligne in self.data:
            lignes_md.append("| " + " | ".join(ligne) + " |")

        return "\n".join(lignes_md)

    def write_to_file(self, filename):
        """
        sortie: Écrit le tableau dans un fichier .md
        """
        with open(filename, "w", encoding="utf-8") as f:
            f.write(self.to_markdown())

if __name__ == "__main__":
    tableau = Tableau(3)
    liste : list[str]
    liste = ["Paris, Lyon, Marseille"]

    tableau.set_header(["Nom", "Âge","Ville"])
    tableau.add_line(["Alice", "25", ["Paris, Lyon, Marseille"]])
    tableau.add_line(["Bob", "30", "Lyon"])

    print(tableau.to_markdown())

    tableau.write_to_file("tableau.md")
