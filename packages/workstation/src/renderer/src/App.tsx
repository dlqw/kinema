/**
 * AniMaker Workstation - Main Application
 *
 * Root component with i18n and theme support.
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '../../stores'
import './App.css'
import '../../i18n' // Initialize i18n

function App() {
  const { t, i18n } = useTranslation()
  const { effectiveTheme, toggleTheme } = useThemeStore()
  const [version, setVersion] = useState('0.1.0')

  useEffect(() => {
    // Version is hardcoded for now
    // TODO: Get version from main process via IPC
  }, [])

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
  }

  return (
    <div className={`app theme-${effectiveTheme}`}>
      <header className="app-header">
        <div className="app-title">
          <h1>{t('app.name')}</h1>
          <span className="version">v{version}</span>
        </div>

        <nav className="app-nav">
          <button>{t('menu.file')}</button>
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
          <button onClick={toggleTheme} className="control-btn">
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

            <div className="action-buttons">
              <button className="primary">{t('welcome.newProject')}</button>
              <button>{t('welcome.openProject')}</button>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎬</div>
                <h3>{t('menu.file')}</h3>
                <p>Project Management</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎨</div>
                <h3>Animation</h3>
                <p>Timeline Editor</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎥</div>
                <h3>Export</h3>
                <p>MP4, WebM, GIF</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🌐</div>
                <h3>i18n</h3>
                <p>Multi-language</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <span>{t('status.ready')}</span>
        <span className="footer-info">
          AniMaker v{version} | {t(`theme.${effectiveTheme}`)} | {i18n.language === 'en' ? 'English' : '中文'}
        </span>
      </footer>
    </div>
  )
}

export default App
