/**
 * Utility functions for importing and exporting glossaries
 * Supports JSON and Markdown formats
 */

// Import Tauri APIs (will be undefined in web browser)
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'

export interface WordItem {
  word: string
  definition: string
  synonyms: string[]
}

export interface Glossary {
  name: string
  description?: string
  words: WordItem[]
}

/**
 * Export glossary to JSON format
 */
export function exportToJSON(glossary: Glossary): string {
  return JSON.stringify(glossary, null, 2)
}

/**
 * Export glossary to Markdown format (table format)
 */
export function exportToMarkdown(glossary: Glossary): string {
  // Helper function to escape pipe characters in table cells
  const escapeCell = (text: string): string => {
    return text.replace(/\|/g, '\\|')
  }

  let markdown = `# ${glossary.name}\n`

  // Add description as subtitle (### format)
  if (glossary.description) {
    markdown += `### ${glossary.description}\n\n`
  } else {
    markdown += `### Glossary\n\n`
  }

  // Table header
  markdown += `| Word | Definition | Synonyms |\n`
  markdown += `| --- | --- | --- |\n`

  // Table rows
  glossary.words.forEach((word) => {
    const synonymsText =
      word.synonyms && word.synonyms.length > 0
        ? word.synonyms.join(', ')
        : '_None_'
    markdown += `| ${escapeCell(word.word)} | ${escapeCell(word.definition)} | ${escapeCell(synonymsText)} |\n`
  })

  return markdown
}

/**
 * Import glossary from JSON string
 * @throws Error if JSON is invalid or missing required fields
 */
export function importFromJSON(jsonString: string): Glossary {
  try {
    const data = JSON.parse(jsonString)

    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Le glossaire doit contenir un champ "name" (string)')
    }

    if (!Array.isArray(data.words)) {
      throw new Error('Le glossaire doit contenir un champ "words" (array)')
    }

    // Validate each word
    data.words.forEach((word: unknown, index: number) => {
      if (typeof word !== 'object' || word === null) {
        throw new Error(`Mot ${index + 1} doit être un objet`)
      }
      const wordObj = word as Record<string, unknown>
      if (!wordObj.word || typeof wordObj.word !== 'string') {
        throw new Error(`Mot ${index + 1}: le champ "word" est requis (string)`)
      }
      if (!wordObj.definition || typeof wordObj.definition !== 'string') {
        throw new Error(
          `Mot ${index + 1}: le champ "definition" est requis (string)`
        )
      }
      if (!Array.isArray(wordObj.synonyms)) {
        throw new Error(
          `Mot ${index + 1}: le champ "synonyms" doit être un tableau`
        )
      }
    })

    return data as Glossary
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Format JSON invalide')
    }
    throw error
  }
}

/**
 * Import glossary from Markdown string
 * Parses markdown formatted glossaries
 * @throws Error if markdown format is invalid
 */
export function importFromMarkdown(markdownString: string): Glossary {
  const lines = markdownString.split('\n')
  const words: WordItem[] = []
  let glossaryName = 'Imported Glossary'
  let description: string | undefined

  // Extract glossary name from first H1
  const h1Match = markdownString.match(/^#\s+([^\r\n]+)/m)
  if (h1Match) {
    glossaryName = h1Match[1].trim()
  }

  // Extract description from H3 subtitle
  const h3Match = markdownString.match(/^###\s+([^\r\n]+)/m)
  if (h3Match) {
    const desc = h3Match[1].trim()
    // Only exclude "Glossary" if it's exactly that word
    if (desc && desc !== 'Glossary') {
      description = desc
    }
  }

  // Parse table format
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Detect table header
    if (line.startsWith('| Word') || line.startsWith('| Mot')) {
      inTable = true
      continue
    }

    // Skip separator line
    if (line.startsWith('| ---')) {
      continue
    }

    // Parse table rows
    if (inTable && line.startsWith('|')) {
      // Split by unescaped pipes only (not \|)
      const cells = line
        .split(/(?<!\\)\|/)
        .map((c) => c.trim())
        .filter((c) => c)
        .map((c) => c.replace(/\\\|/g, '|')) // Unescape pipes in content

      if (cells.length >= 3) {
        const word = cells[0]
        const definition = cells[1]
        const synonymsText = cells[2]

        // Parse synonyms
        let synonyms: string[] = []
        if (
          synonymsText &&
          synonymsText !== '_None_' &&
          synonymsText !== '_Aucun_'
        ) {
          synonyms = synonymsText
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s)
        }

        words.push({
          word,
          definition,
          synonyms,
        })
      }
    }
  }

  if (words.length === 0) {
    throw new Error('No words found in Markdown file')
  }

  return {
    name: glossaryName,
    description,
    words,
  }
}

/**
 * Download a file to the user's computer
 * Compatible with both web browsers and Tauri applications
 */
export async function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): Promise<void> {
  // Check if we're running in Tauri by trying to use the API
  try {
    // Try to use Tauri API
    const filePath = await save({
      defaultPath: filename,
      filters:
        mimeType === 'application/json'
          ? [{ name: 'JSON', extensions: ['json'] }]
          : [{ name: 'Markdown', extensions: ['md'] }],
    })

    if (filePath) {
      // Write file to selected location
      await writeTextFile(filePath, content)
    }
  } catch (error) {
    // If Tauri API is not available, fallback to browser download
    console.log('Tauri not available, using browser download')
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Export and download glossary as JSON
 */
export async function downloadGlossaryAsJSON(
  glossary: Glossary
): Promise<void> {
  const json = exportToJSON(glossary)
  const filename = `${glossary.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
  await downloadFile(json, filename, 'application/json')
}

/**
 * Export and download glossary as Markdown
 */
export async function downloadGlossaryAsMarkdown(
  glossary: Glossary
): Promise<void> {
  const markdown = exportToMarkdown(glossary)
  const filename = `${glossary.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
  await downloadFile(markdown, filename, 'text/markdown')
}

/**
 * Read file content from File object
 */
export function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result
      if (typeof content === 'string') {
        resolve(content)
      } else {
        reject(new Error('Impossible de lire le fichier'))
      }
    }
    reader.onerror = () =>
      reject(new Error('Erreur lors de la lecture du fichier'))
    reader.readAsText(file)
  })
}

/**
 * Import glossary from file
 * Automatically detects format based on file extension
 */
export async function importGlossaryFromFile(file: File): Promise<Glossary> {
  const content = await readFileContent(file)
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'json') {
    return importFromJSON(content)
  } else if (extension === 'md' || extension === 'markdown') {
    return importFromMarkdown(content)
  } else {
    throw new Error('Format de fichier non supporté. Utilisez .json ou .md')
  }
}
