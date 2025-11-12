/**
 * Utility functions for importing and exporting glossaries
 * Supports JSON and Markdown formats
 */

// Import Tauri APIs (will be undefined in web browser)
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

export interface WordItem {
    word: string;
    definition: string;
    synonyms: string[];
}

export interface Glossary {
    name: string;
    description?: string;
    words: WordItem[];
}

/**
 * Export glossary to JSON format
 */
export function exportToJSON(glossary: Glossary): string {
    return JSON.stringify(glossary, null, 2);
}

/**
 * Export glossary to Markdown format
 */
export function exportToMarkdown(glossary: Glossary): string {
    let markdown = `# ${glossary.name}\n\n`;
    
    // Add description if present, otherwise show word count
    if (glossary.description) {
        markdown += `_${glossary.description}_\n\n`;
    } else {
        markdown += `_No description provided_\n\n`;
    }
    
    markdown += `---\n\n`;

    glossary.words.forEach((word, index) => {
        markdown += `## ${index + 1}. ${word.word}\n\n`;
        markdown += `**Definition:** ${word.definition}\n\n`;
        
        if (word.synonyms && word.synonyms.length > 0) {
            markdown += `**Synonyms:** ${word.synonyms.join(', ')}\n\n`;
        } else {
            markdown += `**Synonyms:** _None_\n\n`;
        }
        
        markdown += `---\n\n`;
    });

    return markdown;
}

/**
 * Import glossary from JSON string
 * @throws Error if JSON is invalid or missing required fields
 */
export function importFromJSON(jsonString: string): Glossary {
    try {
        const data = JSON.parse(jsonString);
        
        if (!data.name || typeof data.name !== 'string') {
            throw new Error('Le glossaire doit contenir un champ "name" (string)');
        }
        
        if (!Array.isArray(data.words)) {
            throw new Error('Le glossaire doit contenir un champ "words" (array)');
        }
        
        // Validate each word
        data.words.forEach((word: any, index: number) => {
            if (!word.word || typeof word.word !== 'string') {
                throw new Error(`Mot ${index + 1}: le champ "word" est requis (string)`);
            }
            if (!word.definition || typeof word.definition !== 'string') {
                throw new Error(`Mot ${index + 1}: le champ "definition" est requis (string)`);
            }
            if (!Array.isArray(word.synonyms)) {
                throw new Error(`Mot ${index + 1}: le champ "synonyms" doit être un tableau`);
            }
        });
        
        return data as Glossary;
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error('Format JSON invalide');
        }
        throw error;
    }
}

/**
 * Import glossary from Markdown string
 * Parses markdown formatted glossaries
 * @throws Error if markdown format is invalid
 */
export function importFromMarkdown(markdownString: string): Glossary {
    const lines = markdownString.split('\n');
    const words: WordItem[] = [];
    let glossaryName = 'Imported Glossary';
    let description: string | undefined;
    
    // Extract glossary name from first H1
    const h1Match = markdownString.match(/^#\s+(.+)$/m);
    if (h1Match) {
        glossaryName = h1Match[1].trim();
    }
    
    // Extract description (italic text after title, before first separator)
    // Look for _text_ pattern after the title
    const descMatch = markdownString.match(/_(.+?)_/s);
    if (descMatch) {
        const desc = descMatch[1].trim();
        // Only use as description if it's not the word count format or "No description"
        if (!desc.match(/Glossaire contenant \d+ mot\(s\)/) && 
            desc !== 'No description provided' &&
            !desc.match(/Glossary containing \d+ word\(s\)/i) &&
            !desc.match(/Import - \d+ word\(s\)/)) {
            description = desc;
        }
    }
    
    let currentWord: Partial<WordItem> | null = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Match H2 headers (word titles)
        const wordMatch = line.match(/^##\s+(?:\d+\.\s+)?(.+)$/);
        if (wordMatch) {
            // Save previous word if exists
            if (currentWord && currentWord.word && currentWord.definition) {
                words.push({
                    word: currentWord.word,
                    definition: currentWord.definition,
                    synonyms: currentWord.synonyms || []
                });
            }
            
            // Start new word
            currentWord = {
                word: wordMatch[1].trim(),
                definition: '',
                synonyms: []
            };
            continue;
        }
        
        // Match definition (supports both French and English)
        const defMatch = line.match(/^\*\*(Définition|Definition):\*\*\s+(.+)$/i);
        if (defMatch && currentWord) {
            currentWord.definition = defMatch[2].trim();
            continue;
        }
        
        // Match synonyms (supports both French and English)
        const synMatch = line.match(/^\*\*(Synonymes?|Synonyms?):\*\*\s+(.+)$/i);
        if (synMatch && currentWord) {
            const synText = synMatch[2].trim();
            if (synText !== '_Aucun_' && synText !== 'Aucun' && synText !== '_None_' && synText !== 'None') {
                currentWord.synonyms = synText.split(',').map(s => s.trim()).filter(s => s);
            }
            continue;
        }
    }
    
    // Don't forget the last word
    if (currentWord && currentWord.word && currentWord.definition) {
        words.push({
            word: currentWord.word,
            definition: currentWord.definition,
            synonyms: currentWord.synonyms || []
        });
    }
    
    if (words.length === 0) {
        throw new Error('Aucun mot trouvé dans le fichier Markdown');
    }
    
    return {
        name: glossaryName,
        description,
        words
    };
}

/**
 * Download a file to the user's computer
 * Compatible with both web browsers and Tauri applications
 */
export async function downloadFile(content: string, filename: string, mimeType: string): Promise<void> {
    // Check if we're running in Tauri by trying to use the API
    try {
        // Try to use Tauri API
        const filePath = await save({
            defaultPath: filename,
            filters: mimeType === 'application/json' 
                ? [{ name: 'JSON', extensions: ['json'] }]
                : [{ name: 'Markdown', extensions: ['md'] }]
        });
        
        if (filePath) {
            // Write file to selected location
            await writeTextFile(filePath, content);
        }
    } catch (error) {
        // If Tauri API is not available, fallback to browser download
        console.log('Tauri not available, using browser download');
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

/**
 * Export and download glossary as JSON
 */
export async function downloadGlossaryAsJSON(glossary: Glossary): Promise<void> {
    const json = exportToJSON(glossary);
    const filename = `${glossary.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    await downloadFile(json, filename, 'application/json');
}

/**
 * Export and download glossary as Markdown
 */
export async function downloadGlossaryAsMarkdown(glossary: Glossary): Promise<void> {
    const markdown = exportToMarkdown(glossary);
    const filename = `${glossary.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    await downloadFile(markdown, filename, 'text/markdown');
}

/**
 * Read file content from File object
 */
export function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            if (typeof content === 'string') {
                resolve(content);
            } else {
                reject(new Error('Impossible de lire le fichier'));
            }
        };
        reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
        reader.readAsText(file);
    });
}

/**
 * Import glossary from file
 * Automatically detects format based on file extension
 */
export async function importGlossaryFromFile(file: File): Promise<Glossary> {
    const content = await readFileContent(file);
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'json') {
        return importFromJSON(content);
    } else if (extension === 'md' || extension === 'markdown') {
        return importFromMarkdown(content);
    } else {
        throw new Error('Format de fichier non supporté. Utilisez .json ou .md');
    }
}
