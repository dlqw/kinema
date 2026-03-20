import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [theme, setTheme] = useState('dark')
  const [locale, setLocale] = useState('en')

  useEffect(() => {
    // Load initial settings
    window.api?.getTheme?.().then(setTheme).catch(() => setTheme('dark'))
    window.api?.getLocale?.().then(setLocale).catch(() => setLocale('en'))

    // Listen for theme changes
    const unsubscribeTheme = window.api?.onThemeChange?.((newTheme: string) => {
      setTheme(newTheme)
    })

    // Listen for locale changes
    const unsubscribeLocale = window.api?.onLocaleChange?.((newLocale: string) => {
      setLocale(newLocale)
    })

    return () => {
      unsubscribeTheme?.()
      unsubscribeLocale?.()
    }
  }, [])

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    await window.api?.setTheme?.(newTheme)
  }

  return (
    <div className={`app ${theme}`}>
      <header className="app-header">
        <h1>AniMaker Workstation v0.1.0</h1>
        <div className="controls">
          <button onClick={toggleTheme}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <span>Locale: {locale}</span>
        </div>
      </header>

      <main className="app-main">
        <div className="welcome-panel">
          <h2>Welcome to AniMaker</h2>
          <p>High-performance 2D animation rendering framework</p>

          <div className="features">
            <div className="feature-card">
              <h3>🎬 Project Management</h3>
              <p>Create, open, and save animation projects</p>
            </div>
            <div className="feature-card">
              <h3>🎨 Animation Editor</h3>
              <p>Edit animations with timeline control</p>
            </div>
            <div className="feature-card">
              <h3>🎥 Video Export</h3>
              <p>Export to MP4, WebM, or GIF formats</p>
            </div>
            <div className="feature-card">
              <h3>🌐 Internationalization</h3>
              <p>Multi-language support</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>AniMaker v0.1.0 - Development Phase</p>
      </footer>
    </div>
  )
}

export default App
