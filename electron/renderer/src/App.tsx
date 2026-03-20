/**
 * AniMaker Main Application Component
 *
 * Root component for the AniMaker video workstation.
 */

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    electronAPI: {
      app: {
        getVersion: () => Promise<string>
        getName: () => Promise<string>
        getPlatform: () => Promise<string>
      }
      window: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
      }
    }
  }
}

function App() {
  const [version, setVersion] = useState<string>('')
  const [platform, setPlatform] = useState<string>('')

  useEffect(() => {
    // Load app info
    Promise.all([
      window.electronAPI.app.getVersion(),
      window.electronAPI.app.getPlatform()
    ]).then(([v, p]) => {
      setVersion(v)
      setPlatform(p)
    })
  }, [])

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">
          <h1>AniMaker</h1>
          <span className="version">v{version}</span>
        </div>
        <nav className="app-nav">
          <button>File</button>
          <button>Edit</button>
          <button>View</button>
          <button>Help</button>
        </nav>
      </header>

      <main className="app-main">
        <div className="welcome-screen">
          <h2>Welcome to AniMaker</h2>
          <p>Video Workstation v{version} on {platform}</p>
          <div className="actions">
            <button>New Project</button>
            <button>Open Project</button>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <span>Ready</span>
      </footer>
    </div>
  )
}

export default App
