import { useRef, useState } from 'preact/hooks';
import './Parser.css';
import { ExportModal } from "../../modals/Export/ResultParser";
import type { Glossary } from "../../utils/importExport";

interface ParsedTerm {
  term: string;
  occurrence: number;
}


export function Parser() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("No File");
  const [terms, setTerms] = useState<ParsedTerm[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);


  const readFileContent = (file: File): Promise<string> => {
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
  };

  const handleFileChange = async () => {
    const files = fileInputRef.current?.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);

      try {
        const content = await readFileContent(file);
        // Comptage simple des mots
        const words = content
          .replace(/\r\n/g, ' ')
          .replace(/\n/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 0);

        const counts: Record<string, number> = {};
        words.forEach(w => counts[w] = (counts[w] || 0) + 1);

        const parsedTerms: ParsedTerm[] = Object.entries(counts).map(([term, occurrence]) => ({
          term,
          occurrence
        }));

        setTerms(parsedTerms);
      } catch (err) {
        console.error("Erreur lecture fichier:", err);
      }
    }
  };

  const glossary: Glossary = {
    name: fileName,
    description: "Imported file analysis",
    words: []
  };

  return (
    <div className="parser">
      <div className="parser-header">
        <nav className="deco">
          <img src="/deco.svg" title="Decoration" alt="Decoration" />
          <h1>Parser</h1>
        </nav>

        <div className="header-buttons-parser">
          <button
            className="import-btn-parser"
            onClick={() => fileInputRef.current?.click()}
          >
            <img src="/import.svg" alt="Import icon" />
            Import
          </button>

          <button className="back-btn">
            Back
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileChange}
        />
      </div>

      <div className="terms-found">
        <h1>Terms found in {fileName} :</h1>
        <table className="parser-table">
          <thead>
            <tr>
              <th>Terms</th>
              <th>Occurrence</th>
            </tr>
          </thead>
          <tbody>
            {terms.map(t => (
              <tr key={t.term}>
                <td>{t.term}</td>
                <td>{t.occurrence}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div class="legend">
          <button
            className="download-btn"
            onClick={() => setIsExportModalOpen(true)}
          >
            Download Result
          </button>

          <span class="legend-color"></span>
          <span class="legend-text">Words already present in the glossary</span>
        </div>
      </div>

  
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        glossary={glossary}
        terms={terms}
      />
    </div>
  );
}
