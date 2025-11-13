import { useState, useEffect } from "preact/hooks";
import { loadFromStorage, saveToStorage } from "../../utils/storage";
import { postWords } from "../../utils/api";
import { AddWordModal } from "../../components/AddWordModal";
import { ExportModal } from "../../components/ExportModal";
import "./style.css";
import { useRoute } from "preact-iso";
import { Trash2, Edit2 } from "lucide-preact";

type WordItem = {
	word: string;
	definition: string;
	synonyms: string[];
};

const initialWords: WordItem[] = [];

export function Glossaire() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingWord, setEditingWord] = useState<WordItem | null>(null);
	const [isExportModalOpen, setIsExportModalOpen] = useState(false);
	const { params } = useRoute();

	const glossaryName = params.name || "Unknown Glossary";
	const STORAGE_KEY = `glossary_${glossaryName}`;

	const [words, setWords] = useState<WordItem[]>(() =>
		loadFromStorage(STORAGE_KEY, initialWords)
	);

	useEffect(() => {
		saveToStorage(STORAGE_KEY, words);
	}, [words]);

	const handleAddWord = (word: string, definition: string, synonyms: string[]) => {
		const entry: WordItem = { word, definition, synonyms };

		if (editingWord) {
			setWords((prev) =>
				prev.map((w) => (w.word === editingWord.word ? entry : w))
			);
			setEditingWord(null);
		} else {
			setWords((prev) => [...prev, entry]);
		}

		setIsModalOpen(false);
	};

	const handleDeleteWord = (wordToDelete: string) => {
		if (confirm(`Supprimer le mot "${wordToDelete}" ?`)) {
			setWords((prev) => prev.filter((w) => w.word !== wordToDelete));
		}
	};

	const [, setExportError] = useState<string | null>(null);

	const handleExport = async () => {
		setExportError(null);
		try {
			const endpoint = "/api/words";
			await postWords(endpoint, words);
			setIsExportModalOpen(true);
		} catch (err: any) {
			console.error("Export failed", err);
			setExportError(err?.message || String(err));
			setIsExportModalOpen(true);
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
					<button className="export-btn" onClick={handleExport}>
						<img src="/export.svg" alt="Export icon" />
						{'Export'}
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
							<td>{w.word}</td>
							<td>{w.definition}</td>
							<td>
								{w.synonyms?.length ? (
									w.synonyms.map((s, i) => (
										<span key={i} className="tag">
											{s}
										</span>
									))
								) : (
									<span className="no-synonyme">No synonym</span>
								)}
							</td>
							<td className="action-cell">
						<div className="action-buttons">
							<button
							className="edit-btn"
							onClick={() => {
								setEditingWord(w);
								setIsModalOpen(true);
							}}
							title="Modifier"
							>
							<img src="/modifier.svg" alt="Modifier" />
							</button>
									<button
									className="delete-btn"
									onClick={() => handleDeleteWord(w.word)}
									title="Supprimer"
									>
									<Trash2 size={18} />
									</button>

									
								</div>
							</td>


						</tr>
					))}
				</tbody>
			</table>

			<AddWordModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setEditingWord(null);
				}}
				onAddWord={handleAddWord}
				initialData={editingWord}
			/>

			<ExportModal
				isOpen={isExportModalOpen}
				onClose={() => setIsExportModalOpen(false)}
				glossary={{
					name: glossaryName,
					words: words,
				}}
			/>
		</div>
	);
}
