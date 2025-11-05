import React from "react";
import { AddWordModal } from "../../components/AddWordModal";
import "./style.css";

export function Glossaire() {
	const [isModalOpen, setIsModalOpen] = React.useState(false);

	const handleAddWord = (word: string, definition: string, synonyms: string[]) => {
		console.log("Added:", { word, definition, synonyms });
	};

	return (
		<div className="glossaire">
			<div className="glossaire-header">
				<nav class="deco">
					<img src="/deco.svg"/>
					<h1>Media Library</h1>
				</nav>
				
				<button className="new-word" onClick={() => setIsModalOpen(true)}>
					Add New Word
				</button>
			</div>
			<table class="glossaire-table">
				<thead>
					<tr>
						<th>Word</th>
						<th>Definition</th>
						<th>Synonym</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><span class="word">Book</span></td>
						<td>A set of written or printed sheets bound together</td>
						<td><span class="tag">Tome</span> <span class="tag">Volume</span> <span class="tag">Publication</span></td>
					</tr>
					<tr>
						<td><span class="word">Barrow</span></td>
						<td>To take and use something temporarily before returning it</td>
						<td><span class="tag">Check out</span> <span class="tag">Loan</span></td>
					</tr>
					<tr>
						<td><span class="word">Periodical</span></td>
						<td>A set of written or printed sheets bound together</td>
						<td><span class="tag">Tome</span> <span class="tag">Volume</span> <span class="tag">Publication</span></td>
					</tr>
					<tr>
						<td><span class="word">Shelf</span></td>
						<td>A flat surface used for storing or displaying items</td>
						<td><span class="tag">Rack</span> <span class="tag">Ledge</span></td>
					</tr>
					<tr>
						<td><span class="word">Film</span></td>
						<td>A sequence of moving images, often with sound, that tells a story, documents an event, or presents an artistic idea</td>
						<td><span class="tag">Movie</span> <span class="tag">Motion Picture</span> <span class="tag">Flick</span></td>
					</tr>
					<tr>
						<td><span class="word">Catalog</span></td>
						<td>A complete list of items, typically in systematic order</td>
						<td><span class="tag">Movie</span> <span class="tag">Flick</span></td>
					</tr>
				</tbody>
			</table>
			<button className="export">Export MarkDown</button>

			<AddWordModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onAddWord={handleAddWord}
			/>
		</div>
	);
}
