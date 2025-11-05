import { useState } from "preact/hooks";
import "./AddWordModal.css";

interface AddWordModalPOPUP {
	isOpen: boolean;
	onClose: () => void;
	onAddWord: (word: string, definition: string, synonyms: string[]) => void;
}

export function AddWordModal({ isOpen, onClose, onAddWord }: AddWordModalPOPUP) {
	const [word, setWord] = useState("");
	const [definition, setDefinition] = useState("");
	const [synonyms, setSynonyms] = useState<string[]>([]);
	const [currentSynonym, setCurrentSynonym] = useState("");
	const [errors, setErrors] = useState<{ word?: string; definition?: string }>({});

	if (!isOpen) return null;

	const handleAddSynonym = (e: KeyboardEvent) => {
		if (e.key === "Enter" && currentSynonym.trim() !== "") {
			e.preventDefault();
			setSynonyms([...synonyms, currentSynonym.trim()]);
			setCurrentSynonym("");
		}
	};

	const handleRemoveSynonym = (index: number) => {
		setSynonyms(synonyms.filter((_, i) => i !== index));
	};

	const handleSubmit = () => {
		let newErrors: { word?: string; definition?: string } = {};

		if (!word.trim()) newErrors.word = "Please provide a word !";
		if (!definition.trim()) newErrors.definition = "Please provide a description of the word !";

		setErrors(newErrors);

		if (Object.keys(newErrors).length === 0) {
			onAddWord(word, definition, synonyms);
			setWord("");
			setDefinition("");
			setSynonyms([]);
			setErrors({});
			onClose();
		}
	};

	return (
		<div class="modal-overlay">
			<div class="modal">
				<h2>Add a New Word</h2>

				<label>Word</label>
				<input
					type="text"
					class={errors.word ? "input-error" : ""}
					placeholder="Enter the word"
					value={word}
					onInput={(e) => {
						const val = (e.target as HTMLInputElement).value;
						setWord(val);
						if (errors.word && val.trim() !== "") {
							setErrors((prev) => ({ ...prev, word: undefined }));
						}
					}}
				/>
				<nav class="attention">
				{errors.word && (
					<>
					<img src="/attention.svg" alt="attention" />
					<p class="error-text">{errors.word}</p>
					</>
				)}
				</nav>
								
				<label>Definition</label>
				<textarea
					class={errors.definition ? "input-error" : ""}
					placeholder="Enter the definition"
					value={definition}
					onInput={(e) => {
						const val = (e.target as HTMLTextAreaElement).value;
						setDefinition(val);
						if (errors.definition && val.trim() !== "") {
							setErrors((prev) => ({ ...prev, definition: undefined }));
						}
					}}
				/>

				<nav class="attention">
				{errors.word && (
					<>
					<img src="/attention.svg" alt="attention" />
					<p class="error-text">{errors.definition}</p>
					</>
				)}
				</nav>
								

				<label>Synonyms (Optional)</label>
				<input
					type="text"
					placeholder="Press enter to add a synonym"
					value={currentSynonym}
					onInput={(e) => setCurrentSynonym((e.target as HTMLInputElement).value)}
					onKeyDown={handleAddSynonym}
				/>

				<div class="synonym-list">
					{synonyms.map((syn, i) => (
						<span key={i} class="tag">
							<button
								class="remove-btn"
								onClick={() => handleRemoveSynonym(i)}
								aria-label="remove synonym"
							>
								×
							</button>
							{syn}
						</span>
					))}
				</div>
				<nav>
					<img src="/ia.png" class="logo-ia" />
					<p class="ai-suggestion">AI Suggestions : No suggestion found</p>
				</nav>


				<div class="modal-actions">
					<button class="cancel" onClick={onClose}>Cancel</button>
					<button class="add" onClick={handleSubmit}>Add Word</button>
				</div>
			</div>
		</div>
	);
}
