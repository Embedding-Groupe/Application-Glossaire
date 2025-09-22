import tkinter as tk
from tkinter import ttk
from tkinter import *
import csv
import json

root = tk.Tk()
root.title("SAE Embedding")


table = ttk.Treeview(root, columns=("Token","Description", "Synonyme", "Antonyme"), show="headings")
table.heading("Token", text="Token")
table.heading("Description", text="Description")
table.heading("Synonyme", text="Synonyme")
table.heading("Antonyme", text="Antonyme")

table.column("Token", width=150)
table.column("Description", width=150)
table.column("Synonyme", width=150)
table.column("Antonyme", width=150)


table.pack(expand=True, fill="both")

def ajouter_ligne():
    table.insert("", "end", values=("#Mot","","",""))

button = tk.Button(root, text="Ajouter", width=25, command=ajouter_ligne)
button.pack()


def edit_cell(event):
    region = table.identify("region", event.x, event.y)
    if region != "cell":
        return
    
    row_id = table.identify_row(event.y)
    col = table.identify_column(event.x)
    
   
    x, y, width, height = table.bbox(row_id, col)
    value = table.set(row_id, col)
    
    
    entry = tk.Entry(root)
    entry.place(x=x + table.winfo_x(), y=y + table.winfo_y(), width=width, height=height)
    entry.insert(0, value)
    entry.focus()
    
    
    def save_edit(event=None):
        table.set(row_id, col, entry.get())
        entry.destroy()

    entry.bind("<Return>", save_edit)
    entry.bind("<FocusOut>", save_edit)

table.bind("<Button-1>", edit_cell)

def exportCSV(tree, filename="export.csv"):
    columns = tree["columns"]
    with open(filename, "w", newline="", encoding="utf-8") as fichier:
         writer = csv.writer(fichier)
         writer.writerow(columns)
         for element in tree.get_children():
            values = tree.item(element)["values"]
            writer.writerow(values)

def exportJSON(tree, filename="export.json"):
    columns = tree["columns"]
    data = []
    for element in tree.get_children():
        values = tree.item(element)["values"]
        row = dict(zip(columns, values))
        data.append(row)
    with open(filename, "w", newline="", encoding="utf-8") as fichier:
        values = json.dump(data,fichier, indent=4)

tk.Button(root, text="Exporter CSV", command=lambda: exportCSV(table)).pack()
tk.Button(root, text="Exporter JSON", command=lambda: exportJSON(table)).pack()

root.mainloop() 