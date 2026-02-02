import './ImportChoiceModal.css';

interface ImportChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectOption: (option: 'file' | 'folder') => void;
    error?: string | null;
}

export function ImportChoiceModal({ isOpen, onClose, onSelectOption, error }: ImportChoiceModalProps) {
    if (!isOpen) return null;

    return (
        <div className="import-choice-modal-overlay" onClick={onClose}>
            <div
                className="import-choice-modal-content import-choice-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="import-choice-modal-main">
                    <h2>Select Import Type</h2>

                    <div className="import-choice-modal-body">
                        {error && (
                            <div className="alert alert-error">
                                {error}
                            </div>
                        )}
                        <p className="section-description">
                            Choose how you want to import your glossary files. All files must be in the same format, .py or .java.
                        </p>

                        <div className="import-options">
                            <button
                                className="btn btn-primary"
                                onClick={() => onSelectOption('file')}
                            >
                                Import Single File
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => onSelectOption('folder')}
                            >
                                Import Folder
                            </button>
                        </div>
                    </div>
                </div>

                <div className="import-choice-modal-action">
                    <button className="close-btn" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
