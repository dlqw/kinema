/**
 * Open Project Dialog
 *
 * Modal dialog for opening an existing animation project.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './OpenProjectDialog.css';

interface OpenProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (path?: string) => Promise<boolean>;
  recentProjects?: Array<{ path: string; name: string; updatedAt: string }>;
}

export function OpenProjectDialog({
  isOpen,
  onClose,
  onOpen,
  recentProjects = [],
}: OpenProjectDialogProps) {
  const { t } = useTranslation();
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectFile = async () => {
    setIsOpening(true);
    setError(null);

    try {
      const success = await onOpen();
      if (success) {
        handleClose();
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('project.error.openFailed'));
    } finally {
      setIsOpening(false);
    }
  };

  const handleRecentClick = async (path: string) => {
    setIsOpening(true);
    setError(null);

    try {
      const success = await onOpen(path);
      if (success) {
        handleClose();
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('project.error.openFailed'));
    } finally {
      setIsOpening(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleSelectFileClick = () => {
    void handleSelectFile();
  };

  const handleRecentItemClick = (path: string) => {
    void handleRecentClick(path);
  };

  return (
    <div className="dialog-overlay" onClick={handleClose}>
      <div
        className="dialog-content dialog-large"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="dialog-header">
          <h2>{t('project.open')}</h2>
          <button className="dialog-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="dialog-body">
          {error && <div className="dialog-error">{error}</div>}

          <div className="open-actions">
            <button
              onClick={handleSelectFileClick}
              disabled={isOpening}
              className="primary btn-large"
            >
              {isOpening ? t('project.opening') : t('project.browse')}
            </button>
          </div>

          {recentProjects.length > 0 && (
            <div className="recent-section">
              <h3>{t('welcome.recentProjects')}</h3>
              <div className="recent-list-scroll">
                {recentProjects.map((project) => (
                  <div
                    key={project.path}
                    className="recent-item"
                    onClick={() => handleRecentItemClick(project.path)}
                  >
                    <div className="recent-icon">📁</div>
                    <div className="recent-info">
                      <div className="recent-name">{project.name}</div>
                      <div className="recent-path">{project.path}</div>
                      <div className="recent-time">
                        {new Date(project.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button onClick={handleClose} disabled={isOpening}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
