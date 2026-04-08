/**
 * Save Project Dialog
 *
 * Modal dialog for saving a project with options.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SaveProjectDialog.css';

interface SaveProjectDialogProps {
  isOpen: boolean;
  projectName: string;
  isModified: boolean;
  onClose: () => void;
  onSave: () => Promise<boolean>;
  onSaveAs: () => Promise<boolean>;
}

export function SaveProjectDialog({
  isOpen,
  projectName,
  isModified,
  onClose,
  onSave,
  onSaveAs,
}: SaveProjectDialogProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const success = await onSave();
      if (success) {
        onClose();
      } else {
        setError(t('project.error.saveFailed'));
      }
    } catch {
      setError(t('project.error.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAs = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const success = await onSaveAs();
      if (success) {
        onClose();
      } else {
        setError(t('project.error.saveFailed'));
      }
    } catch {
      setError(t('project.error.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    void handleSave();
  };

  const handleSaveAsClick = () => {
    void handleSaveAs();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content dialog-small" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{t('project.save')}</h2>
          <button className="dialog-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="dialog-body">
          {error && <div className="dialog-error">{error}</div>}

          <div className="save-info">
            <div className="save-project-name">
              <span className="label">{t('project.name')}:</span>
              <span className="value">{projectName}</span>
            </div>
            {isModified && (
              <div className="save-modified">
                <span className="warning">⚠️</span>
                <span>{t('project.unsavedChanges')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="dialog-footer">
          <button onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </button>
          <button onClick={handleSaveAsClick} disabled={isSaving}>
            {t('project.saveAs')}
          </button>
          <button onClick={handleSaveClick} disabled={isSaving} className="primary">
            {isSaving ? t('status.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
