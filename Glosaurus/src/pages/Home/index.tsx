import { useState, useEffect } from "preact/hooks";
import { loadFromStorage, saveToStorage, clearStorage, DEFAULT_STORAGE_KEY } from "../../utils/storage";
import { postWords } from "../../utils/api";
import { AddWordModal } from "../../components/AddWordModal";
import { ExportModal } from "../../components/ExportModal";
import "./style.css";

type WordItem = {
	word: string;
	definition: string;
	synonyms: string[];
};

const initialWords: WordItem[] = [
	{ word: "Book", definition: "A set of written or printed sheets bound together", synonyms: ["Tome", "Volume", "Publication"] },
	{ word: "Borrow", definition: "To take and use something temporarily before returning it", synonyms: ["Check out", "Loan"] },
	{ word: "Periodical", definition: "A publication issued at regular intervals", synonyms: ["Magazine", "Journal", "Serial"] },
	{ word: "Shelf", definition: "A flat surface used for storing or displaying items", synonyms: ["Rack", "Ledge"] },
	{ word: "Film", definition: "A sequence of moving images, often with sound, that tells a story, documents an event, or presents an artistic idea", synonyms: ["Movie", "Motion Picture", "Flick"] },
	{ word: "Catalog", definition: "A complete list of items, typically in systematic order", synonyms: ["Inventory", "List", "Directory"] },
];

export function Glossaire() {
	const STORAGE_KEY = DEFAULT_STORAGE_KEY;

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isExportModalOpen, setIsExportModalOpen] = useState(false);
	const [words, setWords] = useState<WordItem[]>(() => loadFromStorage(STORAGE_KEY, initialWords));
	const [glossaryName] = useState("Media Library");

	// persist words whenever they change
	useEffect(() => {
		saveToStorage(STORAGE_KEY, words);
	}, [words]);

	const handleAddWord = (word: string, definition: string, synonyms: string[]) => {
		const entry: WordItem = { word, definition, synonyms };
		setWords((prev) => [...prev, entry]);
		setIsModalOpen(false);
	};

	const handleReset = () => {
		clearStorage(STORAGE_KEY);
		setWords(initialWords);
	};

	const [isExporting, setIsExporting] = useState(false);
	const [, setExportError] = useState<string | null>(null);

	const handleExport = async () => {
		setExportError(null);
		setIsExporting(true);
		try {
			// default endpoint — change as needed
			const endpoint = '/api/words';
			await postWords(endpoint, words);
			// Open export modal to choose format
			setIsExportModalOpen(true);
		} catch (err: any) {
			console.error('Export failed', err);
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
					<h1>Media Library</h1>
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
					</tr>
				</thead>
				<tbody>
					{words.map((w) => (
						<tr key={w.word}>
							<td><span className="word">{w.word}</span></td>
							<td>{w.definition}</td>
							<td>
								{w.synonyms && w.synonyms.length > 0 ? (
									w.synonyms.map((s, i) => <span key={i} className="tag">{s}</span>)
								) : (
									<span className="no-synonyme">No synonym</span>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<button onClick={handleReset}>Reset</button>

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
