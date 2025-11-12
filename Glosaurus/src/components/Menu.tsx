import { useState, useRef } from 'preact/hooks';
import './Menu.css';
import { AddGlossaryModal } from './AddGlossaryModal';
import { importGlossaryFromFile } from '../utils/importExport';

interface Glossary {
    name: string;
    description: string;
}

export function Menu() {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [glossaries, setGlossaries] = useState<Glossary[]>([]);
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
            // Convertir le glossaire importé au format local
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
                        Add New Glossary
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
                    </tr>
                </thead>
                <tbody>
                    {glossaries.map((g, index) => (
                        <tr key={index}>
                            <td>{g.name}</td>
                            <td>{g.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <AddGlossaryModal 
                    onClose={() => setIsModalOpen(false)}
                    onAdd={handleAddGlossary} // passe la fonction au modal
                />
            )}
        </div>
    );
}
