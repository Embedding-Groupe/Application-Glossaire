import { useState, useRef, useEffect } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import './Menu.css';
import { AddGlossaryModal } from './AddGlossaryModal';
import { importGlossaryFromFile } from '../utils/importExport';
import { loadFromStorage, saveToStorage } from "../utils/storage";
import { Trash2 } from 'lucide-preact'; // 🗑️ icône de poubelle

interface Glossary {
    name: string;
    description: string;
}

export function Menu() {
    const STORAGE_KEY = "glossaries";
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [glossaries, setGlossaries] = useState<Glossary[]>(() => loadFromStorage(STORAGE_KEY, []));
    const { route } = useLocation();

    useEffect(() => {
        saveToStorage(STORAGE_KEY, glossaries);
    }, [glossaries]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddGlossary = (newGlossary: Glossary) => {
        setGlossaries([...glossaries, newGlossary]);
        setIsModalOpen(false);
    };

    const handleFileImport = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) return;

        try {
            const importedGlossary = await importGlossaryFromFile(file);
            
            // Stocker les mots du glossaire dans le localStorage
            const storageKey = `glossary_${importedGlossary.name}`;
            saveToStorage(storageKey, importedGlossary.words);
            
            // Convertir le glossaire importé au format local (juste nom + description pour la liste)
            const newGlossary: Glossary = {
                name: importedGlossary.name,
                description: importedGlossary.description || `Import - ${importedGlossary.words.length} word(s)`
            };
            setGlossaries([...glossaries, newGlossary]);
            window.alert(`Glossary "${importedGlossary.name}" imported successfully! (${importedGlossary.words.length} words)`);
        } catch (error) {
            window.alert(`Error during import: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleDeleteGlossary = (index: number) => {
        if (confirm("Delete this glossary?")) {
            const updated = glossaries.filter((_, i) => i !== index);
            setGlossaries(updated);
        }
    };

    const handleOpenGlossary = (name: string) => {
        route(`/glossaire/${encodeURIComponent(name)}`);
    };

    const filteredGlossaries = glossaries.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="glossaire">
            <div className="glossaire-header">
                <nav className="deco">
                    <img src="/deco.svg" title="Decoration" alt="Decoration" />
                    <h1>My Glossaries</h1>
                </nav>

                <div className="header-buttons">
                    <button className="import-btn" onClick={handleImportClick} title="Import a glossary">
                        <img src="/import.svg" alt="Import icon" />
                        Import
                    </button>
                    <button className="new-word" onClick={() => setIsModalOpen(true)}>
                        Create New Glossary
                    </button>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".json,.md,.markdown"
                onChange={handleFileImport}
                className="hidden-file-input"
                aria-label="Select a file to import"
            />

            <input
                type="text"
                className="search-bar"
                placeholder="Search Glossaries..."
                value={search}
                onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            />

            <table className="glossaire-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th className="actions-column"></th>
                    </tr>
                </thead>
                <tbody>
                    {filteredGlossaries.map((g, index) => (
                        <tr key={index}>
                            <td onClick={() => handleOpenGlossary(g.name)} className="clickable">{g.name}</td>
                            <td onClick={() => handleOpenGlossary(g.name)} className="clickable">{g.description}</td>
                            <td className="actions-cell">
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteGlossary(index)}
                                    title="Delete Glossary"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <AddGlossaryModal 
                    onClose={() => setIsModalOpen(false)}
                    onAdd={handleAddGlossary}
                />
            )}
        </div>
    );
}
