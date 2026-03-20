/**
 * AniMaker Workstation - Main Application
 *
 * Root component with i18n, theme, and project management support.
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore, useProjectStore } from '../../stores'
import { NewProjectDialog } from '../../components'
import './App.css'
import '../../i18n' // Initialize i18n

function App() {
  const { t, i18n } = useTranslation()
  const { effectiveTheme, toggleTheme } = useThemeStore()
  const { currentProject, projectPath, isModified, recentProjects, setCurrentProject, closeProject } = useProjectStore()

  const [showNewDialog, setShowNewDialog] = useState(false)
  const [statusMessage, setStatusMessage] = useState(t('status.ready'))
  const version = '0.1.0'

  useEffect(() => {
    // Load settings on mount
    const loadSettings = async () => {
      try {
        const [theme, locale] = await Promise.all([
          window.electron?.api?.getTheme?.() || Promise.resolve('dark'),
          window.electron?.api?.getLocale?.() || Promise.resolve('en')
        ])

        // Apply theme
        if (theme) {
          document.documentElement.setAttribute('data-theme', theme)
        }

        // Apply locale
        if (locale) {
          i18n.changeLanguage(locale)
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    }

    loadSettings()

    // Listen for theme changes
    const unsubscribeTheme = window.electron?.api?.onThemeChange?.((theme: string) => {
      document.documentElement.setAttribute('data-theme', theme)
    })

    // Listen for locale changes
    const unsubscribeLocale = window.electron?.api?.onLocaleChange?.((locale: string) => {
      i18n.changeLanguage(locale)
    })

    return () => {
      unsubscribeTheme?.()
      unsubscribeLocale?.()
    }
  }, [i18n])

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    window.electron?.api?.setLocale?.(lang)
  }

  const handleToggleTheme = () => {
    toggleTheme()
    const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark'
    window.electron?.api?.setTheme?.(newTheme)
  }

  const handleNewProject = async (name: string, location: string) => {
    setStatusMessage(t('status.loading'))

    try {
      const result = await window.electron?.api?.createProject?.(name, location)

      if (result?.success) {
        const projectData = {
          version: '0.1.0',
          name,
          createdAt: new Date().toISOString(),
          scenes: [],
          settings: {}
        }
        setCurrentProject(projectData, result.path)
        setStatusMessage(t('status.success'))
      } else {
        setStatusMessage(t('status.error'))
      }
    } catch (err: any) {
      console.error('Failed to create project:', err)
      setStatusMessage(t('status.error'))
    }
  }

  const handleOpenProject = async () => {
    setStatusMessage(t('status.loading'))

    try {
      const result = await window.electron?.api?.openProject?.()

      if (result?.success && result.project) {
        setCurrentProject(result.project, result.path)
        setStatusMessage(`${t('project.title')}: ${result.project.name}`)
      } else if (!result?.canceled) {
        setStatusMessage(t('status.error'))
      }
    } catch (err: any) {
      console.error('Failed to open project:', err)
      setStatusMessage(t('status.error'))
    }
  }

  const handleSaveProject = async () => {
    if (!currentProject) return

    setStatusMessage(t('status.saving'))

    try {
      const result = await window.electron?.api?.saveProject?.()

      if (result?.success) {
        setStatusMessage(t('status.saved'))
      } else {
        setStatusMessage(t('status.error'))
      }
    } catch (err: any) {
      console.error('Failed to save project:', err)
      setStatusMessage(t('status.error'))
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveProject()
      }

      // Ctrl+N / Cmd+N - New Project
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setShowNewDialog(true)
      }

      // Ctrl+O / Cmd+O - Open Project
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault()
        handleOpenProject()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentProject])

  const hasRecentProjects = recentProjects.length > 0

  return (
    <div className={`app theme-${effectiveTheme}`}>
      <header className="app-header">
        <div className="app-title">
          <h1>{t('app.name')}</h1>
          <span className="version">v{version}</span>
        </div>

        <nav className="app-nav">
          <button onClick={() => setShowNewDialog(true)}>{t('menu.file')}</button>
          <button>{t('menu.edit')}</button>
          <button>{t('menu.view')}</button>
          <button>{t('menu.help')}</button>
        </nav>

        <div className="app-controls">
          {/* Language Selector */}
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="control-select"
          >
            <option value="en">{t('language.english')}</option>
            <option value="zh">{t('language.chinese')}</option>
          </select>

          {/* Theme Toggle */}
          <button onClick={handleToggleTheme} className="control-btn">
            {effectiveTheme === 'dark' ? '☀️' : '🌙'}
            <span className="control-label">
              {t(`theme.${effectiveTheme}`)}
            </span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="welcome-screen">
          <div className="welcome-content">
            <h2>{t('welcome.title')}</h2>
            <p className="subtitle">{t('welcome.subtitle', { version })}</p>

            {/* Project Status Bar */}
            {currentProject && (
              <div className="project-status">
                <span className="project-info">
                  {currentProject.name}
                  {isModified && <span className="modified-indicator">*</span>}
                </span>
                <span className="project-path">{projectPath}</span>
              </div>
            )}

            <div className="action-buttons">
              <button className="primary" onClick={() => setShowNewDialog(true)}>
                {t('welcome.newProject')}
              </button>
              <button onClick={handleOpenProject}>
                {t('welcome.openProject')}
              </button>
              {currentProject && (
                <button onClick={handleSaveProject}>
                  {t('project.save')}
                </button>
              )}
            </div>

            {/* Recent Projects */}
            {hasRecentProjects && (
              <div className="recent-projects">
                <h3>{t('welcome.recentProjects')}</h3>
                <div className="recent-list">
                  {recentProjects.map(project => (
                    <div
                      key={project.path}
                      className="recent-item"
                      onClick={() => {/* TODO: Open recent project */}}
                    >
                      <div className="recent-icon">📁</div>
                      <div className="recent-info">
                        <div className="recent-name">{project.name}</div>
                        <div className="recent-path">{project.path}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
      </main>

      <footer className="app-footer">
        <span className="status-text">{statusMessage}</span>
        <span className="footer-info">
          {currentProject ? (
            <>
              {currentProject.name}
              {isModified && ' *'}
              {' | '}
            </>
          ) : null}
          {t(`theme.${effectiveTheme}`)} | {i18n.language === 'en' ? 'English' : '中文'}
        </span>
      </footer>

      {/* Dialogs */}
      <NewProjectDialog
        isOpen={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreate={handleNewProject}
      />
    </div>
  )
}

export default App
