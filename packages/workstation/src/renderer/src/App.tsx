/**
 * AniMaker Workstation - Main Application
 *
 * Root component with i18n, theme, and project management support.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore, useProjectStore, useLanguageStore } from '../../stores'
import { NewProjectDialog } from '../../components/ProjectDialog'
import './App.css'
import '../../i18n' // Initialize i18n

function App() {
  const { t, i18n } = useTranslation()
  const { effectiveTheme, toggleTheme } = useThemeStore()
  const { language, setLanguage } = useLanguageStore()
  const { currentProject, openProject, saveProject, closeProject } = useProjectStore()
  const version = '0.1.0'

  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Sync i18n with language store
  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang as 'en' | 'zh')
    i18n.changeLanguage(lang)
  }, [setLanguage, i18n])

  const handleNewProject = useCallback(() => {
    setIsNewProjectDialogOpen(true)
  }, [])

  const handleOpenProject = useCallback(async () => {
    await openProject()
  }, [openProject])

  const handleSaveProject = useCallback(async () => {
    setIsSaving(true)
    await saveProject()
    setIsSaving(false)
  }, [saveProject])

  const handleCloseProject = useCallback(() => {
    closeProject()
  }, [closeProject])

  return (
    <div className={`app theme-${effectiveTheme}`}>
      <header className="app-header">
        <div className="app-title">
          <h1>{currentProject ? currentProject.name : t('app.name')}</h1>
          {currentProject?.modified && <span className="modified-indicator">*</span>}
          <span className="version">v{version}</span>
        </div>

        <nav className="app-nav">
          <button onClick={handleNewProject}>{t('menu.newProject')}</button>
          <button onClick={handleOpenProject}>{t('menu.openProject')}</button>
          <button
            onClick={handleSaveProject}
            disabled={!currentProject || isSaving}
          >
            {isSaving ? t('common.saving') : t('menu.saveProject')}
          </button>
          {currentProject && (
            <button onClick={handleCloseProject}>{t('menu.closeProject')}</button>
          )}
        </nav>

        <div className="app-controls">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="control-select"
          >
            <option value="en">{t('language.english')}</option>
            <option value="zh">{t('language.chinese')}</option>
          </select>

          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="control-btn">
            {effectiveTheme === 'dark' ? '☀️' : '🌙'}
            <span className="control-label">
              {t(`theme.${effectiveTheme}`)}
            </span>
          </button>
        </div>
      </header>

      <main className="app-main">
        {currentProject ? (
          <div className="project-workspace">
            {/* Project workspace - future timeline and preview components */}
            <div className="workspace-placeholder">
              <h2>{currentProject.name}</h2>
              <p>{t('workspace.selectScene')}</p>
            </div>
          </div>
        ) : (
          <div className="welcome-screen">
            <div className="welcome-content">
              <h2>{t('welcome.title')}</h2>
              <p className="subtitle">{t('welcome.subtitle', { version })}</p>

              <div className="action-buttons">
                <button className="primary" onClick={handleNewProject}>
                  {t('welcome.newProject')}
                </button>
                <button onClick={handleOpenProject}>{t('welcome.openProject')}</button>
              </div>

              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">🎬</div>
                  <h3>{t('features.projectManagement')}</h3>
                  <p>{t('features.projectManagementDesc')}</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🎨</div>
                  <h3>{t('features.animation')}</h3>
                  <p>{t('features.animationDesc')}</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🎥</div>
                  <h3>{t('features.export')}</h3>
                  <p>{t('features.exportDesc')}</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🌐</div>
                  <h3>{t('features.i18n')}</h3>
                  <p>{t('features.i18nDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <span>
          {currentProject
            ? `${t('status.project')}: ${currentProject.name}`
            : t('status.ready')}
        </span>
        <span className="footer-info">
          AniMaker v{version} | {t(`theme.${effectiveTheme}`)} | {language === 'en' ? 'English' : '中文'}
        </span>
      </footer>

      {/* Dialogs */}
      <NewProjectDialog
        isOpen={isNewProjectDialogOpen}
        onClose={() => setIsNewProjectDialogOpen(false)}
      />
    </div>
  )
}

export default App
