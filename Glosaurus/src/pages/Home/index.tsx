import { useState, useEffect } from "preact/hooks";
import { loadFromStorage, saveToStorage} from "../../utils/storage";
import { postWords } from "../../utils/api";
import { AddWordModal } from "../../components/AddWordModal";
import { ExportModal } from "../../components/ExportModal";
import "./style.css";
import { useRoute } from "preact-iso";
import { Trash2 } from "lucide-preact";

type WordItem = {
	word: string;
	definition: string;
	synonyms: string[];
};

const initialWords: WordItem[] = [];

export function Glossaire() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isExportModalOpen, setIsExportModalOpen] = useState(false);
	const { params } = useRoute();
	const glossaryName = params.name || "Unknown Glossary";

	const STORAGE_KEY = `glossary_${glossaryName}`;

	const [words, setWords] = useState<WordItem[]>(() => loadFromStorage(STORAGE_KEY, initialWords));
	useEffect(() => {
		saveToStorage(STORAGE_KEY, words);
	}, [words]);

	const handleAddWord = (word: string, definition: string, synonyms: string[]) => {
		const entry: WordItem = { word, definition, synonyms };
		setWords((prev) => [...prev, entry]);
		setIsModalOpen(false);
	};

	const handleDeleteWord = (wordToDelete: string) => {
		if (confirm(`Supprimer le mot "${wordToDelete}" ?`)) {
			const updated = words.filter((w) => w.word !== wordToDelete);
			setWords(updated);
		}
	};

	const [isExporting, setIsExporting] = useState(false);
	const [, setExportError] = useState<string | null>(null);

	const handleExport = async () => {
		setExportError(null);
		setIsExporting(true);
		try {
			const endpoint = "/api/words";
			await postWords(endpoint, words);
			// Open export modal to choose format
			setIsExportModalOpen(true);
		} catch (err: any) {
			console.error("Export failed", err);
			setExportError(err?.message || String(err));
			// If POST fails, still open modal for local export
			setIsExportModalOpen(true);
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div className="glossaire">
			<div className="glossaire-header">
				<nav className="deco">
					<img src="/deco.svg" title="Decoration" alt="Decoration" />
					<h1>{glossaryName}</h1>
				</nav>

				<div className="header-buttons">
					<button className="export-btn" onClick={handleExport} disabled={isExporting}>
						<img src="/export.svg" alt="Export icon" />
						{isExporting ? 'Exporting...' : 'Export'}
					</button>
					<button className="new-word" onClick={() => setIsModalOpen(true)}>
						Add New Word
					</button>
				</div>
			</div>

			<table className="glossaire-table">
				<thead>
					<tr>
						<th>Word</th>
						<th>Definition</th>
						<th>Synonyms</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{words.map((w) => (
						<tr key={w.word}>
							<td><span className="word">{w.word}</span></td>
							<td>{w.definition}</td>
							<td>
								{w.synonyms?.length ? (
									w.synonyms.map((s, i) => <span key={i} className="tag">{s}</span>)
								) : (
									<span className="no-synonyme">No synonym</span>
								)}
							</td>
							<td className="trash-cell">
								<button
									className="delete-btn"
									onClick={() => handleDeleteWord(w.word)}
									title="Supprimer"
								>
									<Trash2 size={20} />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<AddWordModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onAddWord={handleAddWord}
			/>

			<ExportModal
				isOpen={isExportModalOpen}
				onClose={() => setIsExportModalOpen(false)}
				glossary={{
					name: glossaryName,
					words: words
				}}
			/>
		</div>
	);
}
