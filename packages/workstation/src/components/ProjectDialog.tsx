/**
 * New Project Dialog Component
 *
 * Dialog for creating a new AniMaker project
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProjectStore } from '../stores'

interface NewProjectDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function NewProjectDialog({ isOpen, onClose }: NewProjectDialogProps) {
  const { t } = useTranslation()
  const { createProject, isLoading, error } = useProjectStore()

  const [projectName, setProjectName] = useState('')
  const [projectPath, setProjectPath] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectName.trim()) {
      return
    }

    const success = await createProject(projectName, projectPath || undefined)

    if (success) {
      setProjectName('')
      setProjectPath('')
      onClose()
    }
  }

  const handleBrowse = async () => {
    // In Electron, this would open a directory picker
    // For now, we'll use a text input
    // In production: const result = await window.api.selectDirectory()
  }

  if (!isOpen) return null

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <h2>{t('project.new')}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="projectName">{t('project.name')}</label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t('project.namePlaceholder')}
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="projectPath">{t('project.location')}</label>
            <div className="input-with-button">
              <input
                id="projectPath"
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder={t('project.locationPlaceholder')}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleBrowse}
                disabled={isLoading}
                className="btn-browse"
              >
                {t('common.browse')}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="dialog-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-cancel"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!projectName.trim() || isLoading}
              className="btn-primary"
            >
              {isLoading ? t('common.creating') : t('project.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewProjectDialog
