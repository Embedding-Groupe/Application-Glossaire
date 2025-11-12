import { useState, useEffect } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import './Menu.css';
import { AddGlossaryModal } from './AddGlossaryModal';
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

    const handleAddGlossary = (newGlossary: Glossary) => {
        setGlossaries([...glossaries, newGlossary]);
        setIsModalOpen(false);
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

                <button className="new-word" onClick={() => setIsModalOpen(true)}>
                    Create New Glossary
                </button>
            </div>

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
