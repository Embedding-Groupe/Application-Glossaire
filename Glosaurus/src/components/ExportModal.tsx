import { useState } from "preact/hooks";
import type { Glossary } from "../utils/importExport";
import {
    downloadGlossaryAsJSON,
    downloadGlossaryAsMarkdown
} from "../utils/importExport";
import "./ExportModal.css";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    glossary: Glossary;
}

export function ExportModal({ isOpen, onClose, glossary }: ExportModalProps) {
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [isExporting, setIsExporting] = useState<boolean>(false);

    if (!isOpen) return null;

    const handleExportJSON = async () => {
        setIsExporting(true);
        setError('');
        setSuccess('');
        try {
            await downloadGlossaryAsJSON(glossary);
            setSuccess('Glossaire exporté en JSON avec succès !');
            setTimeout(() => {
                setSuccess('');
                onClose();
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'export');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportMarkdown = async () => {
        setIsExporting(true);
        setError('');
        setSuccess('');
        try {
            await downloadGlossaryAsMarkdown(glossary);
            setSuccess('Glossaire exporté en Markdown avec succès !');
            setTimeout(() => {
                setSuccess('');
                onClose();
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'export');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div class="modal-overlay" onClick={onClose}>
            <div class="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
                <div class="modal-header">
                    <h2>📤 Exporter le Glossaire</h2>
                    <button class="close-btn" onClick={onClose}>×</button>
                </div>

                <div class="modal-body">
                    {error && <div class="alert alert-error">{error}</div>}
                    {success && <div class="alert alert-success">{success}</div>}

                    <div class="export-section">
                        <p class="section-description">
                            Exportez votre glossaire "<strong>{glossary.name}</strong>" contenant <strong>{glossary.words.length}</strong> mot(s).
                        </p>
                        
                        <div class="export-options">
                            <div class="export-option">
                                <div class="option-info">
                                    <h3>📄 Format JSON</h3>
                                    <p>Format structuré, idéal pour les sauvegardes et le partage de données.</p>
                                </div>
                                <button 
                                    class="btn btn-primary"
                                    onClick={handleExportJSON}
                                    disabled={isExporting}
                                >
                                    {isExporting ? 'Export en cours...' : 'Exporter en JSON'}
                                </button>
                            </div>

                            <div class="export-option">
                                <div class="option-info">
                                    <h3>📝 Format Markdown</h3>
                                    <p>Format lisible, parfait pour la documentation et la lecture.</p>
                                </div>
                                <button 
                                    class="btn btn-primary"
                                    onClick={handleExportMarkdown}
                                    disabled={isExporting}
                                >
                                    {isExporting ? 'Export en cours...' : 'Exporter en Markdown'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
