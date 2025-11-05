import { useEffect, useRef, useState } from "preact/hooks";
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

	const modalRef = useRef<HTMLDivElement | null>(null);
	const firstInputRef = useRef<HTMLInputElement | null>(null);
	const previouslyFocused = useRef<Element | null>(null);

	useEffect(() => {
		if (isOpen) {
			// Save previously focused element
			previouslyFocused.current = document.activeElement;
			// Prevent background scroll
			const prev = document.body.style.overflow;
			document.body.style.overflow = 'hidden';

			// focus first input after a tick
			setTimeout(() => {
				firstInputRef.current?.focus();
			}, 0);

			const onKey = (e: KeyboardEvent) => {
				if (e.key === 'Escape') onClose();
			};
			document.addEventListener('keydown', onKey);
			return () => {
				document.removeEventListener('keydown', onKey);
				document.body.style.overflow = prev;
				// restore focus
				(previouslyFocused.current as HTMLElement | null)?.focus?.();
			};
		}
	}, [isOpen]);

	const handleAddSynonym = (e: any) => {
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

	if (!isOpen) return null;

	return (
		<div className="modal-overlay" role="dialog" aria-modal="true">
			<div className="modal" ref={modalRef}>
				<h2>Add a New Word</h2>

				<label className={"word-label"}>Word</label>
				<input
					ref={firstInputRef}
					type="text"
					className={`word-area ${errors.word ? "input-error" : ""}`}
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
				<nav className="attention">
					{errors.word && (
						<>
							<img src="/attention.svg" alt="attention" />
							<p className="error-text">{errors.word}</p>
						</>
					)}
				</nav>

				<label className="definition-label">Definition</label>
				<textarea
					className={`definition-area ${errors.definition ? "input-error" : ""}`}
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

				<nav className="attention">
					{errors.definition && (
						<>
							<img src="/attention.svg" alt="attention" />
							<p className="error-text">{errors.definition}</p>
						</>
					)}
				</nav>

				<label className={"synonym-label"}>Synonyms (Optional)</label>
				<input
					type="text"
					placeholder="Press enter to add a synonym"
					value={currentSynonym}
					onInput={(e) => setCurrentSynonym((e.target as HTMLInputElement).value)}
					onKeyDown={handleAddSynonym}
				/>

				<div className="synonym-list">
					{synonyms.map((syn, i) => (
						<span key={i} className="tag">
							<button
								className="remove-btn"
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
					<img src="/public/ia.png" className="logo-ia" title="AI Suggestions" />
					<p className="ai-suggestion">AI Suggestions : No suggestion found</p>
				</nav>


				<div className="modal-actions">
					<button className="cancel" onClick={onClose}>Cancel</button>
					<button className="add" onClick={handleSubmit}>Add Word</button>
				</div>
			</div>
		</div>
	);
}
