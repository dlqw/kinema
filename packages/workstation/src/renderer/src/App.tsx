import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NewProjectDialog, OpenProjectDialog, SaveProjectDialog } from '../../components';
import { useLanguageStore, useProjectStore, useThemeStore } from '../../stores';
import type { ProjectInfo, ProjectScene } from '../../stores';
import './App.css';
import '../../i18n';

type ExportPreset = 'render-plan' | 'project-snapshot';
type PendingAction = 'close-project' | null;

const VERSION = '0.1.0';

function formatProjectDate(value: string, language: 'en' | 'zh'): string {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function asPositiveInteger(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function asQuality(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : fallback;
}

function isRecentProject(project: ProjectInfo): project is ProjectInfo & { path: string } {
  return typeof project.path === 'string' && project.path.length > 0;
}

function summarizeNotes(notes: string, fallback: string): string {
  if (!notes.trim()) {
    return fallback;
  }
  return notes.length > 88 ? `${notes.slice(0, 88)}...` : notes;
}

function App() {
  const { t, i18n } = useTranslation();
  const { mode, effectiveTheme, setMode } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const {
    currentProject,
    currentProjectData,
    selectedSceneId,
    recentProjects,
    isLoading,
    error,
    openProject,
    saveProject,
    saveProjectAs,
    closeProject,
    removeFromRecent,
    clearRecentProjects,
    selectScene,
    updateProjectName,
    updateProjectSettings,
    addScene,
    updateScene,
    duplicateScene,
    removeScene,
  } = useProjectStore();

  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isOpenProjectDialogOpen, setIsOpenProjectDialogOpen] = useState(false);
  const [isSaveProjectDialogOpen, setIsSaveProjectDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [appMessage, setAppMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderOutput, setRenderOutput] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportPreset>('render-plan');
  const [exportWidth, setExportWidth] = useState('1920');
  const [exportHeight, setExportHeight] = useState('1080');
  const [exportFps, setExportFps] = useState('30');
  const [exportQuality, setExportQuality] = useState('0.9');

  const recentProjectList = recentProjects.filter(isRecentProject);
  const selectedScene = useMemo(
    () => currentProjectData?.scenes.find((scene) => scene.id === selectedSceneId) ?? null,
    [currentProjectData, selectedSceneId],
  );
  const totalSceneDuration = useMemo(
    () => currentProjectData?.scenes.reduce((sum, scene) => sum + scene.duration, 0) ?? 0,
    [currentProjectData],
  );

  useEffect(() => {
    const unsubscribeTheme = window.api.onThemeChange((nextTheme) => {
      if (nextTheme === 'light' || nextTheme === 'dark') {
        setMode(nextTheme);
      }
    });

    const unsubscribeLocale = window.api.onLocaleChange((nextLocale) => {
      if (nextLocale === 'en' || nextLocale === 'zh') {
        setLanguage(nextLocale);
        void i18n.changeLanguage(nextLocale);
      }
    });

    const unsubscribeRender = window.api.onRenderProgress((progress) => {
      setRenderProgress(progress);
    });

    return () => {
      unsubscribeTheme();
      unsubscribeLocale();
      unsubscribeRender();
    };
  }, [i18n, setLanguage, setMode]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const [savedTheme, savedLocale] = await Promise.all([
          window.api.getTheme(),
          window.api.getLocale(),
        ]);

        if (!active) {
          return;
        }

        if (savedTheme === 'light' || savedTheme === 'dark') {
          setMode(savedTheme);
        }

        if (savedLocale === 'en' || savedLocale === 'zh') {
          setLanguage(savedLocale);
          await i18n.changeLanguage(savedLocale);
        }
      } catch {
        if (active) {
          setAppMessage(t('notifications.settingsSyncFailed'));
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [i18n, setLanguage, setMode, t]);

  useEffect(() => {
    if (!currentProjectData) {
      return;
    }

    setExportWidth(String(currentProjectData.settings.width));
    setExportHeight(String(currentProjectData.settings.height));
    setExportFps(String(currentProjectData.settings.fps));
  }, [currentProjectData]);

  const handleLanguageChange = async (nextLanguage: 'en' | 'zh'): Promise<void> => {
    setLanguage(nextLanguage);
    await i18n.changeLanguage(nextLanguage);
    const result = await window.api.setLocale(nextLanguage);
    if (!result.success && !result.canceled) {
      setAppMessage(result.error ?? t('notifications.settingsSyncFailed'));
    }
  };

  const handleThemeToggle = async (): Promise<void> => {
    const nextTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
    setMode(nextTheme);
    const result = await window.api.setTheme(nextTheme);
    if (!result.success && !result.canceled) {
      setAppMessage(result.error ?? t('notifications.settingsSyncFailed'));
    }
  };

  const handleOpenProject = async (path?: string): Promise<boolean> => {
    setAppMessage(null);
    return openProject(path);
  };

  const handleCloseProject = async (): Promise<void> => {
    if (currentProject?.modified) {
      setPendingAction('close-project');
      setIsSaveProjectDialogOpen(true);
      return;
    }

    const success = await closeProject();
    if (success) {
      setRenderOutput(null);
      setRenderProgress(0);
      setAppMessage(null);
    }
  };

  const handleSaveFromDialog = async (): Promise<boolean> => {
    const success = await saveProject();
    if (!success) {
      return false;
    }

    if (pendingAction === 'close-project') {
      setPendingAction(null);
      return closeProject();
    }

    return true;
  };

  const handleSaveAsFromDialog = async (): Promise<boolean> => {
    const success = await saveProjectAs();
    if (!success) {
      return false;
    }

    if (pendingAction === 'close-project') {
      setPendingAction(null);
      return closeProject();
    }

    return true;
  };

  const handleRender = async (): Promise<void> => {
    if (!currentProject) {
      return;
    }

    setAppMessage(null);
    setRenderOutput(null);
    setRenderProgress(0);
    setIsExporting(true);

    try {
      const result = await window.api.renderVideo({
        format: exportFormat,
        width: asPositiveInteger(exportWidth, currentProjectData?.settings.width ?? 1920),
        height: asPositiveInteger(exportHeight, currentProjectData?.settings.height ?? 1080),
        fps: asPositiveInteger(exportFps, currentProjectData?.settings.fps ?? 30),
        quality: asQuality(exportQuality, 0.9),
      });

      if (result.success) {
        setRenderOutput(result.outputPath ?? null);
        setRenderProgress(100);
        setAppMessage(t('export.status.completed'));
        return;
      }

      if (result.canceled) {
        setRenderProgress(0);
        setAppMessage(t('export.status.cancelled'));
        return;
      }

      setAppMessage(result.error ?? t('export.errors.failed'));
    } catch {
      setAppMessage(t('export.errors.failed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancelRender = async (): Promise<void> => {
    await window.api.cancelRender();
    setIsExporting(false);
    setRenderProgress(0);
    setAppMessage(t('export.status.cancelled'));
  };

  const handleProjectNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void updateProjectName(event.target.value);
  };

  const handleSettingsNumberChange = (
    key: 'width' | 'height' | 'fps',
    value: string,
    fallback: number,
  ) => {
    void updateProjectSettings({ [key]: asPositiveInteger(value, fallback) });
  };

  const handleBackgroundColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void updateProjectSettings({ backgroundColor: event.target.value });
  };

  const handleAddScene = () => {
    void addScene();
  };

  const handleDuplicateScene = (sceneId: string) => {
    void duplicateScene(sceneId);
  };

  const handleRemoveScene = (sceneId: string) => {
    void removeScene(sceneId);
  };

  const handleSceneFieldChange = (
    sceneId: string,
    key: keyof Pick<ProjectScene, 'name' | 'duration' | 'notes' | 'enabled'>,
    value: string | number | boolean,
  ) => {
    void updateScene(sceneId, { [key]: value } as Partial<ProjectScene>);
  };

  const handleLanguageSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    void handleLanguageChange(event.target.value as 'en' | 'zh');
  };

  const handleThemeClick = () => {
    void handleThemeToggle();
  };

  const handleSaveClick = () => {
    void saveProject();
  };

  const handleSaveDialogClick = () => {
    setPendingAction(null);
    setIsSaveProjectDialogOpen(true);
  };

  const handleRenderClick = () => {
    void handleRender();
  };

  const handleCancelRenderClick = () => {
    void handleCancelRender();
  };

  const closeSaveDialog = () => {
    setPendingAction(null);
    setIsSaveProjectDialogOpen(false);
  };

  return (
    <div className={`app theme-${effectiveTheme}`}>
      <header className="app-header">
        <div className="brand-block">
          <span className="eyebrow">{t('app.title')}</span>
          <div className="app-title">
            <h1>{currentProject ? currentProject.name : t('app.name')}</h1>
            {currentProject?.modified && <span className="modified-indicator">Draft</span>}
            <span className="version">v{VERSION}</span>
          </div>
        </div>

        <nav className="app-nav">
          <button onClick={() => setIsNewProjectDialogOpen(true)}>{t('menu.newProject')}</button>
          <button onClick={() => setIsOpenProjectDialogOpen(true)}>{t('menu.openProject')}</button>
          <button onClick={handleSaveClick} disabled={!currentProject || isLoading}>
            {t('menu.saveProject')}
          </button>
          <button onClick={handleSaveDialogClick} disabled={!currentProject || isLoading}>
            {t('menu.saveProjectAs')}
          </button>
          <button onClick={() => void handleCloseProject()} disabled={!currentProject || isLoading}>
            {t('menu.closeProject')}
          </button>
        </nav>

        <div className="app-controls">
          <select value={language} onChange={handleLanguageSelect} className="control-select">
            <option value="en">{t('language.english')}</option>
            <option value="zh">{t('language.chinese')}</option>
          </select>
          <button onClick={handleThemeClick} className="control-btn">
            {mode === 'system' ? t('theme.system') : t(`theme.${effectiveTheme}`)}
          </button>
        </div>
      </header>

      <main className="app-main">
        {(error || appMessage) && (
          <div className={`status-banner ${error ? 'status-banner-error' : 'status-banner-info'}`}>
            {error ?? appMessage}
          </div>
        )}

        {currentProject && currentProjectData ? (
          <div className="workspace-shell">
            <aside className="workspace-column">
              <section className="panel">
                <span className="eyebrow">{t('project.current')}</span>
                <h2>{t('project.summary')}</h2>
                <dl className="detail-list">
                  <div>
                    <dt>{t('project.name')}</dt>
                    <dd>{currentProject.name}</dd>
                  </div>
                  <div>
                    <dt>{t('project.path')}</dt>
                    <dd>{currentProject.path ?? t('project.noPath')}</dd>
                  </div>
                  <div>
                    <dt>{t('project.createdAt')}</dt>
                    <dd>{formatProjectDate(currentProject.createdAt, language)}</dd>
                  </div>
                  <div>
                    <dt>{t('project.updatedAt')}</dt>
                    <dd>{formatProjectDate(currentProject.updatedAt, language)}</dd>
                  </div>
                  <div>
                    <dt>{t('project.sceneCount')}</dt>
                    <dd>{currentProjectData.scenes.length}</dd>
                  </div>
                  <div>
                    <dt>{t('project.totalDuration')}</dt>
                    <dd>{totalSceneDuration.toFixed(1)}s</dd>
                  </div>
                </dl>
              </section>

              <section className="panel">
                <div className="section-header">
                  <div>
                    <span className="eyebrow">{t('welcome.recentProjects')}</span>
                    <h2>{t('project.recentTitle')}</h2>
                  </div>
                  {recentProjectList.length > 0 && (
                    <button className="ghost-button" onClick={clearRecentProjects}>
                      {t('common.clear')}
                    </button>
                  )}
                </div>

                {recentProjectList.length > 0 ? (
                  <div className="recent-projects">
                    {recentProjectList.map((project) => (
                      <article className="recent-card" key={project.path}>
                        <button
                          className="recent-open"
                          onClick={() => void handleOpenProject(project.path)}
                        >
                          <span>{project.name}</span>
                          <span className="recent-path">{project.path}</span>
                        </button>
                        <button
                          className="ghost-button"
                          onClick={() => removeFromRecent(project.path)}
                        >
                          {t('common.remove')}
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">{t('welcome.emptyRecent')}</p>
                )}
              </section>
            </aside>

            <section className="workspace-center">
              <section className="panel hero-panel">
                <span className="eyebrow">{t('workspace.editor')}</span>
                <h2>{t('workspace.subtitle')}</h2>
                <p>{t('workspace.editorDescription')}</p>
              </section>

              <section className="panel">
                <div className="section-header">
                  <div>
                    <span className="eyebrow">{t('project.title')}</span>
                    <h2>{t('project.setup')}</h2>
                  </div>
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span>{t('project.name')}</span>
                    <input
                      type="text"
                      value={currentProjectData.name}
                      onChange={handleProjectNameChange}
                    />
                  </label>

                  <div className="field-row">
                    <label className="field">
                      <span>{t('project.frameWidth')}</span>
                      <input
                        type="number"
                        min="320"
                        value={currentProjectData.settings.width}
                        onChange={(event) =>
                          handleSettingsNumberChange(
                            'width',
                            event.target.value,
                            currentProjectData.settings.width,
                          )
                        }
                      />
                    </label>
                    <label className="field">
                      <span>{t('project.frameHeight')}</span>
                      <input
                        type="number"
                        min="240"
                        value={currentProjectData.settings.height}
                        onChange={(event) =>
                          handleSettingsNumberChange(
                            'height',
                            event.target.value,
                            currentProjectData.settings.height,
                          )
                        }
                      />
                    </label>
                    <label className="field">
                      <span>{t('project.fps')}</span>
                      <input
                        type="number"
                        min="1"
                        value={currentProjectData.settings.fps}
                        onChange={(event) =>
                          handleSettingsNumberChange(
                            'fps',
                            event.target.value,
                            currentProjectData.settings.fps,
                          )
                        }
                      />
                    </label>
                  </div>

                  <label className="field field-compact">
                    <span>{t('project.backgroundColor')}</span>
                    <input
                      type="color"
                      value={currentProjectData.settings.backgroundColor}
                      onChange={handleBackgroundColorChange}
                    />
                  </label>
                </div>
              </section>

              <section className="panel">
                <div className="section-header">
                  <div>
                    <span className="eyebrow">{t('workspace.scenes')}</span>
                    <h2>{t('workspace.sceneBoard')}</h2>
                  </div>
                  <button className="primary-button" onClick={handleAddScene}>
                    {t('scene.add')}
                  </button>
                </div>

                <div className="scene-list">
                  {currentProjectData.scenes.map((scene) => (
                    <article
                      key={scene.id}
                      className={`scene-card ${scene.id === selectedSceneId ? 'scene-card-active' : ''}`}
                    >
                      <button className="scene-card-main" onClick={() => selectScene(scene.id)}>
                        <div className="scene-card-header">
                          <strong>{scene.name}</strong>
                          <span
                            className={`scene-state ${scene.enabled ? 'scene-enabled' : 'scene-disabled'}`}
                          >
                            {scene.enabled ? t('scene.enabled') : t('scene.disabled')}
                          </span>
                        </div>
                        <span className="scene-meta">
                          {scene.duration.toFixed(1)}s{' | '}
                          {summarizeNotes(scene.notes, t('scene.noNotes'))}
                        </span>
                      </button>
                      <div className="scene-card-actions">
                        <button
                          className="ghost-button"
                          onClick={() => handleDuplicateScene(scene.id)}
                        >
                          {t('scene.duplicate')}
                        </button>
                        <button
                          className="ghost-button"
                          onClick={() => handleRemoveScene(scene.id)}
                          disabled={currentProjectData.scenes.length <= 1}
                        >
                          {t('scene.remove')}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {selectedScene && (
                <section className="panel">
                  <span className="eyebrow">{t('scene.selected')}</span>
                  <h2>{t('scene.editor')}</h2>

                  <div className="form-grid">
                    <label className="field">
                      <span>{t('scene.name')}</span>
                      <input
                        type="text"
                        value={selectedScene.name}
                        onChange={(event) =>
                          handleSceneFieldChange(selectedScene.id, 'name', event.target.value)
                        }
                      />
                    </label>

                    <div className="field-row">
                      <label className="field">
                        <span>{t('scene.duration')}</span>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={selectedScene.duration}
                          onChange={(event) =>
                            handleSceneFieldChange(
                              selectedScene.id,
                              'duration',
                              Math.max(
                                0.1,
                                Number.parseFloat(event.target.value) || selectedScene.duration,
                              ),
                            )
                          }
                        />
                      </label>

                      <label className="toggle-field">
                        <span>{t('scene.enabled')}</span>
                        <input
                          type="checkbox"
                          checked={selectedScene.enabled}
                          onChange={(event) =>
                            handleSceneFieldChange(
                              selectedScene.id,
                              'enabled',
                              event.target.checked,
                            )
                          }
                        />
                      </label>
                    </div>

                    <label className="field">
                      <span>{t('scene.notes')}</span>
                      <textarea
                        rows={5}
                        value={selectedScene.notes}
                        onChange={(event) =>
                          handleSceneFieldChange(selectedScene.id, 'notes', event.target.value)
                        }
                      />
                    </label>
                  </div>
                </section>
              )}
            </section>

            <aside className="workspace-column">
              <section className="panel">
                <span className="eyebrow">{t('menu.export')}</span>
                <h2>{t('export.title')}</h2>
                <p className="panel-description">{t('export.subtitle')}</p>

                <div className="form-grid">
                  <label className="field">
                    <span>{t('export.target')}</span>
                    <select
                      value={exportFormat}
                      onChange={(event) => setExportFormat(event.target.value as ExportPreset)}
                    >
                      <option value="render-plan">{t('export.targets.renderPlan')}</option>
                      <option value="project-snapshot">
                        {t('export.targets.projectSnapshot')}
                      </option>
                    </select>
                  </label>

                  <div className="field-row">
                    <label className="field">
                      <span>{t('export.width')}</span>
                      <input
                        type="number"
                        min="320"
                        value={exportWidth}
                        onChange={(event) => setExportWidth(event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>{t('export.height')}</span>
                      <input
                        type="number"
                        min="240"
                        value={exportHeight}
                        onChange={(event) => setExportHeight(event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="field-row">
                    <label className="field">
                      <span>{t('export.fps')}</span>
                      <input
                        type="number"
                        min="1"
                        value={exportFps}
                        onChange={(event) => setExportFps(event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>{t('export.quality')}</span>
                      <input
                        type="number"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={exportQuality}
                        onChange={(event) => setExportQuality(event.target.value)}
                      />
                    </label>
                  </div>
                </div>

                <div className="progress-block">
                  <div className="progress-header">
                    <span>{isExporting ? t('status.exporting') : t('export.status.ready')}</span>
                    <span>{renderProgress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${renderProgress}%` }} />
                  </div>
                </div>

                <div className="action-row">
                  <button
                    className="primary-button"
                    onClick={handleRenderClick}
                    disabled={isExporting}
                  >
                    {t('export.start')}
                  </button>
                  <button
                    className="secondary-button"
                    onClick={handleCancelRenderClick}
                    disabled={!isExporting}
                  >
                    {t('export.cancel')}
                  </button>
                </div>

                {renderOutput && (
                  <div className="output-box">
                    <span className="output-label">{t('export.lastOutput')}</span>
                    <code>{renderOutput}</code>
                  </div>
                )}

                <p className="panel-note">{t('export.note')}</p>
              </section>
            </aside>
          </div>
        ) : (
          <div className="welcome-shell">
            <section className="hero-panel panel">
              <span className="eyebrow">{t('app.title')}</span>
              <h2>{t('welcome.title')}</h2>
              <p>{t('welcome.description', { version: VERSION })}</p>
              <div className="action-row">
                <button className="primary-button" onClick={() => setIsNewProjectDialogOpen(true)}>
                  {t('welcome.newProject')}
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setIsOpenProjectDialogOpen(true)}
                >
                  {t('welcome.openProject')}
                </button>
              </div>
            </section>

            <section className="panel">
              <div className="section-header">
                <div>
                  <span className="eyebrow">{t('welcome.recentProjects')}</span>
                  <h2>{t('welcome.openRecent')}</h2>
                </div>
              </div>

              {recentProjectList.length > 0 ? (
                <div className="recent-projects">
                  {recentProjectList.map((project) => (
                    <article className="recent-card" key={project.path}>
                      <button
                        className="recent-open"
                        onClick={() => void handleOpenProject(project.path)}
                      >
                        <span>{project.name}</span>
                        <span className="recent-path">{project.path}</span>
                      </button>
                      <button
                        className="ghost-button"
                        onClick={() => removeFromRecent(project.path)}
                      >
                        {t('common.remove')}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">{t('welcome.emptyRecent')}</p>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <span>
          {currentProject ? `${t('project.current')}: ${currentProject.name}` : t('status.ready')}
        </span>
        <span className="footer-info">
          Kinema v{VERSION} | {t(`theme.${effectiveTheme}`)} |{' '}
          {language === 'en' ? 'English' : '中文'}
        </span>
      </footer>

      <NewProjectDialog
        isOpen={isNewProjectDialogOpen}
        onClose={() => setIsNewProjectDialogOpen(false)}
      />

      <OpenProjectDialog
        isOpen={isOpenProjectDialogOpen}
        onClose={() => setIsOpenProjectDialogOpen(false)}
        onOpen={handleOpenProject}
        recentProjects={recentProjectList}
      />

      <SaveProjectDialog
        isOpen={isSaveProjectDialogOpen}
        projectName={currentProject?.name ?? t('app.name')}
        isModified={Boolean(currentProject?.modified || pendingAction)}
        onClose={closeSaveDialog}
        onSave={handleSaveFromDialog}
        onSaveAs={handleSaveAsFromDialog}
      />
    </div>
  );
}

export default App;
