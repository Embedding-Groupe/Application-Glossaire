import { useState, useEffect } from "preact/hooks";
import { loadFromStorage, saveToStorage, clearStorage, DEFAULT_STORAGE_KEY } from "../../utils/storage";
import { postWords } from "../../utils/api";
import { AddWordModal } from "../../components/AddWordModal";
import "./style.css";

type WordItem = {
	word: string;
	definition: string;
	synonyms: string[];
};

const initialWords: WordItem[] = [
	{ word: "Book", definition: "A set of written or printed sheets bound together", synonyms: ["Tome", "Volume", "Publication"] },
	{ word: "Barrow", definition: "To take and use something temporarily before returning it", synonyms: ["Check out", "Loan"] },
	{ word: "Periodical", definition: "A set of written or printed sheets bound together", synonyms: ["Tome", "Volume", "Publication"] },
	{ word: "Shelf", definition: "A flat surface used for storing or displaying items", synonyms: ["Rack", "Ledge"] },
	{ word: "Film", definition: "A sequence of moving images, often with sound, that tells a story, documents an event, or presents an artistic idea", synonyms: ["Movie", "Motion Picture", "Flick"] },
	{ word: "Catalog", definition: "A complete list of items, typically in systematic order", synonyms: ["Movie", "Flick"] },
];

export function Glossaire() {
	const STORAGE_KEY = DEFAULT_STORAGE_KEY;

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [words, setWords] = useState<WordItem[]>(() => loadFromStorage(STORAGE_KEY, initialWords));

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
	const [exportError, setExportError] = useState<string | null>(null);

	const handleExport = async () => {
		setExportError(null);
		setIsExporting(true);
		try {
			// default endpoint — change as needed
			const endpoint = '/api/words';
			await postWords(endpoint, words);
			// create and download JSON file after successful POST
			downloadJSON(words);
			window.alert('Export réussi, fichier JSON téléchargé.');
		} catch (err: any) {
			console.error('Export failed', err);
			setExportError(err?.message || String(err));
			// Even if POST fails, still create local JSON file so user doesn't lose data
			downloadJSON(words);
			window.alert('Export failed (server). Fichier JSON téléchargé localement. Error: ' + (err?.message || String(err)));
		} finally {
			setIsExporting(false);
		}
	};

	function downloadJSON(data: unknown) {
		try {
			const content = JSON.stringify(data, null, 2);
			const blob = new Blob([content], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			const ts = new Date().toISOString().replace(/[:.]/g, '-');
			a.href = url;
			a.download = `glossaire-${ts}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (e) {
			console.error('Download failed', e);
		}
	}

	return (
		<div className="glossaire">
			<div className="glossaire-header">
				<nav className="deco">
					<img src="/deco.svg" title="Decoration" />
					<h1>Media Library</h1>
				</nav>

				<button className="new-word" onClick={() => setIsModalOpen(true)}>
					Add New Word
				</button>
			</div>
			<table className="glossaire-table">
				<thead>
					<tr>
						<th>Word</th>
						<th>Definition</th>
						<th>Synonym</th>
					</tr>
				</thead>
				<tbody>
					{words.map((w, idx) => (
						<tr key={idx}>
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
			<button className="export" onClick={handleExport} disabled={isExporting}>
				{isExporting ? 'Exporting...' : 'Export MarkDown'}
			</button>
			<button onClick={handleReset}>Reset</button>

			<AddWordModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onAddWord={handleAddWord}
			/>
		</div>
	);
}
