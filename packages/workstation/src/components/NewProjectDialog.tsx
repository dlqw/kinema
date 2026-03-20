/**
 * New Project Dialog
 *
 * Modal dialog for creating a new animation project.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './NewProjectDialog.css'

interface NewProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, location: string) => Promise<void>
}

export function NewProjectDialog({ isOpen, onClose, onCreate }: NewProjectDialogProps) {
  const { t } = useTranslation()
  const [projectName, setProjectName] = useState('')
  const [location, setLocation] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCreate = async () => {
    // Validate
    if (!projectName.trim()) {
      setError(t('project.error.nameRequired'))
      return
    }

    if (!location.trim()) {
      setError(t('project.error.locationRequired'))
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      await onCreate(projectName.trim(), location.trim())
      handleClose()
    } catch (err: any) {
      setError(err?.message || t('project.error.createFailed'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectLocation = async () => {
    // Request location from main process
    const result = await window.electron?.api?.selectDirectory?.()
    if (result) {
      setLocation(result)
    }
  }

  const handleClose = () => {
    setProjectName('')
    setLocation('')
    setError(null)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating) {
      handleCreate()
    } else if (e.key === 'Escape') {
      handleClose()
    }
  }

  return (
    <div className="dialog-overlay" onClick={handleClose}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{t('project.new.title')}</h2>
          <button className="dialog-close" onClick={handleClose}>×</button>
        </div>

        <div className="dialog-body">
          {error && (
            <div className="dialog-error">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="project-name">{t('project.new.nameLabel')}</label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('project.new.namePlaceholder')}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="project-location">{t('project.new.locationLabel')}</label>
            <div className="input-with-button">
              <input
                id="project-location"
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('project.new.locationPlaceholder')}
              />
              <button type="button" onClick={handleSelectLocation}>
                {t('project.new.browse')}
              </button>
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button onClick={handleClose} disabled={isCreating}>
            {t('common.cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="primary"
          >
            {isCreating ? t('project.new.creating') : t('project.new.create')}
          </button>
        </div>
      </div>
    </div>
  )
}
