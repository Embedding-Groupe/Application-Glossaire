import { useState, useEffect } from "preact/hooks";
import { loadFromStorage, saveToStorage, clearStorage, DEFAULT_STORAGE_KEY } from "../../utils/storage";
import { postWords } from "../../utils/api";
import { AddWordModal } from "../../components/AddWordModal";
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
	const { params } = useRoute();
	const glossaryName = params.name || "Unknown Glossary";

	// Clé unique par glossaire
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
			downloadJSON(words);
			window.alert("Export réussi, fichier JSON téléchargé.");
		} catch (err: any) {
			console.error("Export failed", err);
			setExportError(err?.message || String(err));
			downloadJSON(words);
			window.alert(
				"Export failed (server). Fichier JSON téléchargé localement. Error: " +
					(err?.message || String(err))
			);
		} finally {
			setIsExporting(false);
		}
	};

	function downloadJSON(data: unknown) {
		try {
			const content = JSON.stringify(data, null, 2);
			const blob = new Blob([content], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			const ts = new Date().toISOString().replace(/[:.]/g, "-");
			a.href = url;
			a.download = `glossaire-${ts}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (e) {
			console.error("Download failed", e);
		}
	}

	return (
		<div className="glossaire">
			<div className="glossaire-header">
				<nav className="deco">
					<img src="/deco.svg" title="Decoration" alt="Decoration" />
					<h1>{glossaryName}</h1>
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

			<button className="export fixed-export" onClick={handleExport} disabled={isExporting}>
				{isExporting ? "Exporting..." : "Export JSON"}
			</button>

			<AddWordModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onAddWord={handleAddWord}
			/>
		</div>
	);
}
