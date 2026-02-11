import { useState } from 'preact/hooks';
import './GitHubImportModal.css';

interface GitHubImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (url: string) => void;
    isLoading?: boolean;
    error?: string | null;
}

export function GitHubImportModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    isLoading = false,
    error = null 
}: GitHubImportModalProps) {
    const [repoUrl, setRepoUrl] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        if (repoUrl.trim()) {
            onSubmit(repoUrl.trim());
        }
    };

    const handleClose = () => {
        setRepoUrl('');
        onClose();
    };

    return (
        <div className="github-modal-overlay" onClick={handleClose}>
            <div
                className="github-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="github-modal-main">
                    <h2>Import from GitHub Repository</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="github-modal-body">
                            <div className="info-banner">
                                <img src="/info.svg" alt="Info" />
                                <span>Only <b>public repositories</b> are supported. Private repositories require authentication which is not currently available.</span>
                            </div>

                            <div className="form-group">
                                <label htmlFor="repo-url">Repository URL</label>
                                <input
                                    id="repo-url"
                                    type="text"
                                    className="form-input"
                                    placeholder="https://github.com/username/repository"
                                    value={repoUrl}
                                    onInput={(e) => setRepoUrl((e.target as HTMLInputElement).value)}
                                    disabled={isLoading}
                                    required
                                />
                                <small className="form-hint">
                                    Example: https://github.com/torvalds/linux
                                </small>
                            </div>

                            {error && (
                                <div className="error-message">
                                    <img src="/error.svg" alt="Error" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        <div className="github-modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isLoading || !repoUrl.trim()}
                            >
                                {isLoading ? 'Cloning & Parsing...' : 'Import Repository'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
