import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import posthog from 'posthog-js';
import AppHeader from './components/AppHeader';
import AboutPage from './components/AboutPage';
import CanvasWorkspace, { type InspectorRequest } from './components/CanvasWorkspace';
import ExportOverlay from './components/ExportOverlay';
import NewScenarioDialog from './components/NewScenarioDialog';
import Sidebar from './components/Sidebar';
import TemplateContributionDialog from './components/TemplateContributionDialog';
import { CANVAS_ZOOM_STEP } from './constants';
import { useCanvasViewport } from './hooks/useCanvasViewport';
import { useGridSnap } from './hooks/useGridSnap';
import { useScenario } from './hooks/useScenario';
import type { SelectedType } from './hooks/useScenario';
import { useScenarioExport } from './hooks/useScenarioExport';
import { scenarioPayloadFromTemplate, situationTemplates } from './data/situationTemplates';
import { createScenarioShareUrlAsync, parseScenarioFromJson, parseScenarioShareUrlAsync } from './utils/exporter';
import { getCanvasContentBounds, getCanvasContentRect, type CanvasContentRect } from './utils/simulation';
import { sponsorshipLinks, templateRepository } from './utils/appConfig';
import type { TemplateContributionMode } from './utils/templateContribution';
import type { DisplayMode, ExportFormat, ExportOptions, ExportQuality, ScenarioExportPayload, Theme } from './types';
import { DEFAULT_EXPORT_QUALITY } from './utils/exportSettings';
import UpdateToast from './components/UpdateToast';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';

const THEME_STORAGE_KEY = 'tack-wise-theme';
type ScenarioStartSource = 'new' | 'template' | 'import' | 'shared_link';

function isStillImageFormat(format: ExportFormat): format is 'png' | 'jpeg' {
  return format === 'png' || format === 'jpeg';
}

function getVisibleContentRect(
  frames: ScenarioExportPayload['frames'],
  currentFrameIndex: number,
  displayMode: DisplayMode,
) {
  const visibleFrames = displayMode === 'cumulative'
    ? frames.slice(0, currentFrameIndex + 1)
    : frames.slice(Math.max(0, currentFrameIndex - 1), currentFrameIndex + 1);

  return getCanvasContentRect(visibleFrames);
}

function getScenarioAnalyticsProps(frames: ScenarioExportPayload['frames'], currentFrameIndex: number) {
  const objectCount = frames.reduce((total, frame) => total
    + frame.boats.length
    + frame.marks.length
    + (frame.connections?.length ?? 0)
    + (frame.arrows?.length ?? 0)
    + (frame.comments?.length ?? 0)
    + (frame.images?.length ?? 0), 0);

  return {
    frame_count: frames.length,
    object_count: objectCount,
    current_frame_index: currentFrameIndex,
  };
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  } catch {
    // Fall back to the system preference when storage is unavailable.
  }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export default function App() {
  const { dismissUpdate, isUpdateAvailable, refresh } = useServiceWorkerUpdate();
  const scenario = useScenario();
  const canvasContentBounds = useMemo(() => getCanvasContentBounds(scenario.frames), [scenario.frames]);
  const exportContentRect = useMemo(() => getCanvasContentRect(scenario.frames), [scenario.frames]);
  const visibleCanvasContentRect = useMemo(
    () => getVisibleContentRect(scenario.frames, scenario.currentFrameIndex, scenario.settings.displayMode),
    [scenario.currentFrameIndex, scenario.frames, scenario.settings.displayMode],
  );
  const viewport = useCanvasViewport(canvasContentBounds);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inspectorRequest, setInspectorRequest] = useState<InspectorRequest | null>(null);
  const [isImageExporting, setIsImageExporting] = useState(false);
  const [exportTheme, setExportTheme] = useState<Theme | null>(null);
  const [isNewScenarioDialogOpen, setIsNewScenarioDialogOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [page, setPage] = useState<'editor' | 'about'>(() => (
    typeof window !== 'undefined' && window.location.pathname === '/about' ? 'about' : 'editor'
  ));
  const [exportQuality, setExportQuality] = useState<ExportQuality>(DEFAULT_EXPORT_QUALITY);
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [templateContributionMode, setTemplateContributionMode] = useState<TemplateContributionMode | null>(null);
  const gridSnap = useGridSnap(gridSnapEnabled);
  const { redo, undo } = scenario;
  const { importScenario } = scenario;
  const shareScenarioPromiseRef = useRef<Promise<ScenarioExportPayload | null> | null>(null);
  const loadScenarioAndFitRef = useRef<((payload: ScenarioExportPayload, templateId?: string | null, source?: Exclude<ScenarioStartSource, 'new'>) => void) | null>(null);
  const inspectorRequestIdRef = useRef(0);
  const modalReturnFocusRef = useRef<HTMLElement | null>(null);

  const navigateTo = (nextPage: 'editor' | 'about') => {
    const targetPath = nextPage === 'about' ? '/about' : '/';
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setPage(nextPage);
  };

  useEffect(() => {
    const handlePopState = () => setPage(window.location.pathname === '/about' ? 'about' : 'editor');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    document.title = page === 'about' ? 'About — Tack Wise' : 'Tack Wise';
  }, [page]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const donationStatus = params.get('donation');
    if (donationStatus !== 'success' && donationStatus !== 'cancelled') return;

    if (donationStatus === 'success') {
      posthog.capture('donation_checkout_returned', {
        provider: 'stripe',
        has_checkout_session: Boolean(params.get('session_id')),
      });
    } else {
      posthog.capture('donation_cancelled', { provider: 'stripe' });
    }

    params.delete('donation');
    params.delete('session_id');
    const nextSearch = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`);
  }, []);

  const handleLayerOpenInspector = (id: string, type: Exclude<SelectedType, null>) => {
    setIsSidebarOpen(false);
    scenario.selectObject(id, type);
    inspectorRequestIdRef.current += 1;
    setInspectorRequest({ id, type, requestId: inspectorRequestIdRef.current });
  };

  const loadScenarioAndFit = (
    payload: ScenarioExportPayload,
    templateId: string | null = null,
    source?: Exclude<ScenarioStartSource, 'new'>,
  ) => {
    const contentRect = getVisibleContentRect(
      payload.frames,
      payload.currentFrameIndex,
      payload.settings?.displayMode ?? 'single',
    );

    flushSync(() => {
      importScenario(payload);
      setLoadedTemplateId(templateId);
    });
    viewport.fitCanvasToContent(contentRect);
    if (source) {
      posthog.capture('scenario_started', {
        source,
        ...getScenarioAnalyticsProps(payload.frames, payload.currentFrameIndex),
      });
    }
  };
  loadScenarioAndFitRef.current = loadScenarioAndFit;

  useEffect(() => {
    let isMounted = true;
    shareScenarioPromiseRef.current ??= parseScenarioShareUrlAsync();

    void shareScenarioPromiseRef.current.then((sharedScenario) => {
      if (!isMounted || !sharedScenario) return;
      loadScenarioAndFitRef.current?.(sharedScenario, null, 'shared_link');
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const loadedTemplate = situationTemplates.find((template) => template.id === loadedTemplateId);

  const saveViewportAndFitCanvas = (autoFit: boolean, contentRect: CanvasContentRect) => {
    if (!autoFit) return null;

    const previousViewport = {
      position: { ...viewport.canvasPosition },
      zoom: viewport.canvasZoom,
    };

    flushSync(() => viewport.fitCanvasToContent(contentRect));
    return previousViewport;
  };

  const restoreViewport = (previousViewport: ReturnType<typeof saveViewportAndFitCanvas>) => {
    if (previousViewport) viewport.setCanvasViewport(previousViewport.position, previousViewport.zoom);
  };

  const handleLoadTemplate = (template: typeof situationTemplates[number]) => {
    posthog.capture('template_loaded', {
      template_id: template.id,
      ...getScenarioAnalyticsProps(template.frames, 0),
    });
    loadScenarioAndFit(scenarioPayloadFromTemplate(template), template.id, 'template');
  };

  const handleShareScenario = async () => {
    const shareProps = {
      source: loadedTemplateId ? 'template' : 'editor',
      ...getScenarioAnalyticsProps(scenario.frames, scenario.currentFrameIndex),
    };

    let shareUrl: string;
    try {
      shareUrl = await createScenarioShareUrlAsync({
        version: 2,
        frames: scenario.frames,
        currentFrameIndex: scenario.currentFrameIndex,
        settings: scenario.settings,
      });
    } catch {
      posthog.capture('scenario_share_failed', { ...shareProps, reason: 'share_generation_failed' });
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      posthog.capture('scenario_shared', { ...shareProps, share_method: 'clipboard' });
      window.alert('Share link copied to clipboard.');
    } catch {
      const promptResult = window.prompt('Copy this share link:', shareUrl);
      if (promptResult !== null) {
        posthog.capture('scenario_shared', { ...shareProps, share_method: 'prompt' });
      } else {
        posthog.capture('scenario_share_failed', { ...shareProps, reason: 'user_cancelled' });
      }
    }
  };

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The theme still applies for this session when storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() !== 'z') return;

      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [redo, undo]);
  const exportState = useScenarioExport({
    currentFrameIndex: scenario.currentFrameIndex,
    frames: scenario.frames,
    playSpeed: scenario.playSpeed,
    playbackProgress: scenario.playbackProgress,
    setCurrentFrameIndex: scenario.setCurrentFrameIndex,
    setPlaybackProgress: scenario.setPlaybackProgress,
    setIsPlaybackSampling: scenario.setIsPlaybackSampling,
    setIsPlaying: scenario.setIsPlaying,
    settings: scenario.settings,
    stageRef: viewport.stageRef,
    stageSize: viewport.stageSize,
    exportQuality,
  });

  const isCanvasExporting = exportState.isExporting || isImageExporting;

  if (page === 'about') {
    return (
      <AboutPage
        theme={theme}
        onBackToEditor={() => navigateTo('editor')}
        onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
      />
    );
  }

  const resetToNewScenario = () => {
    scenario.createNewScenario();
    posthog.capture('scenario_started', {
      source: 'new',
      frame_count: 1,
      object_count: 0,
      current_frame_index: 0,
    });
    posthog.capture('new_scenario_created', { source: 'new' });
    setLoadedTemplateId(null);
    setIsNewScenarioDialogOpen(false);
  };

  const handleNewScenario = (returnFocusTarget: HTMLElement | null) => {
    modalReturnFocusRef.current = returnFocusTarget;
    if (scenario.hasUnsavedChanges) {
      setIsNewScenarioDialogOpen(true);
      return;
    }

    resetToNewScenario();
  };

  const handleExportAndStartNewScenario = () => {
    const exportProps = {
      format: 'json',
      trigger: 'new_scenario_dialog',
      ...getScenarioAnalyticsProps(scenario.frames, scenario.currentFrameIndex),
    };
    try {
      exportState.triggerJsonExport(scenario.frames, scenario.currentFrameIndex);
      posthog.capture('scenario_exported', exportProps);
    } catch {
      posthog.capture('scenario_export_failed', exportProps);
    }
    resetToNewScenario();
  };

  const handleExport = (options: ExportOptions) => {
    const exportProps: Record<string, unknown> = {
      format: options.format,
      theme: options.theme,
      auto_fit: options.autoFit,
      ...getScenarioAnalyticsProps(scenario.frames, scenario.currentFrameIndex),
    };
    if (isStillImageFormat(options.format) || options.format === 'gif' || options.format === 'webm' || options.format === 'mp4') {
      exportProps.fps = options.fps;
    }

    if (options.format === 'json') {
      try {
        exportState.triggerJsonExport(scenario.frames, scenario.currentFrameIndex);
        posthog.capture('scenario_exported', exportProps);
      } catch {
        posthog.capture('scenario_export_failed', exportProps);
      }
      return;
    }

    const previousViewport = saveViewportAndFitCanvas(
      options.autoFit,
      isStillImageFormat(options.format) ? visibleCanvasContentRect : exportContentRect,
    );

    if (isStillImageFormat(options.format)) {
      flushSync(() => {
        setExportTheme(options.theme);
        setIsImageExporting(true);
      });
      try {
        const succeeded = exportState.triggerImageExport(options.format);
        posthog.capture(succeeded ? 'scenario_exported' : 'scenario_export_failed', exportProps);
      } catch {
        posthog.capture('scenario_export_failed', exportProps);
      } finally {
        restoreViewport(previousViewport);
        setIsImageExporting(false);
        setExportTheme(null);
      }
      return;
    }

    flushSync(() => setExportTheme(options.theme));
    void exportState.triggerExport(options.format, options.fps)
      .then((succeeded) => {
        posthog.capture(succeeded ? 'scenario_exported' : 'scenario_export_failed', exportProps);
      })
      .finally(() => {
        restoreViewport(previousViewport);
        setExportTheme(null);
      });
  };

  const handleImportJson = async (file: File) => {
    try {
      const payload = parseScenarioFromJson(await file.text());
      posthog.capture('scenario_imported', {
        source: 'file',
        ...getScenarioAnalyticsProps(payload.frames, payload.currentFrameIndex),
      });
      loadScenarioAndFit(payload, null, 'import');
    } catch (error) {
      console.error('Import error: ', error);
      posthog.capture('scenario_import_failed', { source: 'file', reason: 'invalid_json' });
      window.alert('Could not import scenario. Please select a valid Tack Wise JSON file.');
    }
  };

  return (
    <main className={`app-shell ${theme}-theme${scenario.settings.presenterMode ? ' presenter-mode' : ''}`}>
      {isUpdateAvailable && <UpdateToast onDismiss={dismissUpdate} onRefresh={refresh} />}
      <AppHeader
        isExporting={isCanvasExporting}
        presenterMode={scenario.settings.presenterMode}
        onNewScenario={handleNewScenario}
        onExport={handleExport}
        onImportJson={handleImportJson}
        onShareScenario={handleShareScenario}
        onOpenAbout={() => navigateTo('about')}
        onLoadTemplate={handleLoadTemplate}
        onContributeTemplate={(returnFocusTarget) => {
          modalReturnFocusRef.current = returnFocusTarget;
          posthog.capture('template_contribution_opened', { mode: 'create' });
          setTemplateContributionMode('create');
        }}
        onUpdateTemplate={(returnFocusTarget) => {
          modalReturnFocusRef.current = returnFocusTarget;
          if (loadedTemplate) {
            posthog.capture('template_contribution_opened', { mode: 'update' });
            setTemplateContributionMode('update');
          }
        }}
        canUpdateTemplate={Boolean(loadedTemplate)}
        templates={situationTemplates}
        exportQuality={exportQuality}
        onExportQualityChange={setExportQuality}
        onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
        onTogglePresenter={() => {
          const nextPresenterMode = !scenario.settings.presenterMode;
          posthog.capture('presenter_mode_toggled', { presenter_mode: nextPresenterMode });
          if (nextPresenterMode) {
            posthog.capture('presentation_started', {
              ...getScenarioAnalyticsProps(scenario.frames, scenario.currentFrameIndex),
              display_mode: scenario.settings.displayMode,
            });
          }
          scenario.updateSettings({ presenterMode: nextPresenterMode });
        }}
        theme={theme}
        sponsorship={sponsorshipLinks}
      />

      <section className="workspace">
        {!scenario.settings.presenterMode && <Sidebar
          currentFrameIndex={scenario.currentFrameIndex}
          frames={scenario.frames}
          scenarioTitle={scenario.settings.title ?? 'Untitled situation'}
          onScenarioTitleChange={(title) => scenario.updateSettings({ title })}
          unanimatableTransitionIndices={scenario.unanimatableTransitionIndices}
          onFixTransition={scenario.fixTransition}
          onAddFrame={scenario.addFrame}
          onDeleteFrame={scenario.deleteFrame}
          onDuplicateFrame={scenario.duplicateFrame}
          onRenameFrame={scenario.renameFrame}
          onSelectFrame={scenario.selectFrame}
          onToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenInspector={handleLayerOpenInspector}
          selectedId={scenario.selectedId}
          selectedType={scenario.selectedType}
        />}

        <CanvasWorkspace
          activeFrame={scenario.displayFrame}
          inspectorFrame={scenario.activeFrame}
          autoSailTrim={scenario.autoSailTrim}
          canvasPosition={viewport.canvasPosition}
          canvasZoom={viewport.canvasZoom}
          constrainPosition={viewport.constrainPosition}
          currentFrameIndex={scenario.currentFrameIndex}
          displayMode={scenario.settings.displayMode}
          showFrameTitle={scenario.settings.showFrameTitle ?? true}
          showFrameNumber={scenario.settings.showFrameNumber ?? true}
          presenterMode={scenario.settings.presenterMode}
          theme={exportTheme ?? theme}
          frames={scenario.frames}
          canRedo={scenario.canRedo}
          canUndo={scenario.canUndo}
          hasAutosave={scenario.hasAutosave}
          getSnappedPosition={gridSnap.getSnappedPosition}
          gridSnapEnabled={gridSnapEnabled}
          isPlaying={scenario.isPlaying}
          playbackWarning={scenario.playbackWarning}
          isExporting={isCanvasExporting}
          handleCanvasDragEnd={viewport.handleCanvasDragEnd}
          handleCanvasWheel={viewport.handleCanvasWheel}
          maxZoom={viewport.maxZoom}
          minZoom={viewport.minZoom}
          onAddBoat={scenario.addBoat}
          onAddMark={scenario.addMark}
          onAddArrow={scenario.addArrow}
          onAddComment={scenario.addComment}
          onAddRuleComment={scenario.addRuleComment}
          onAddImage={scenario.addImage}
          onMoveBoat={scenario.moveBoat}
          onRotateBoat={(boatId, heading) => scenario.updateBoat(boatId, { heading })}
          onMoveMark={scenario.moveMark}
          onConnectMarks={scenario.connectMarks}
          onRemoveMarkConnection={scenario.removeMarkConnection}
          onReplaceMarkConnection={scenario.replaceMarkConnection}
          onMoveArrow={scenario.moveArrow}
          onMoveComment={scenario.moveComment}
          onMoveImage={scenario.moveImage}
          onDeleteSelected={scenario.deleteSelected}
          onDuplicateSelected={scenario.duplicateSelected}
          onClearSelection={scenario.clearSelection}
          onSetAutoSailTrim={scenario.setAutoSailTrim}
          onSetDisplayMode={(displayMode) => scenario.updateSettings({ displayMode })}
          onSetShowFrameTitle={(showFrameTitle) => scenario.updateSettings({ showFrameTitle })}
          onSetShowFrameNumber={(showFrameNumber) => scenario.updateSettings({ showFrameNumber })}
          onSetGridSnapEnabled={setGridSnapEnabled}
          onSetShowGrid={setShowGrid}
          onRedo={scenario.redo}
          onRestoreAutosave={() => scenario.restoreAutosave()}
          onTogglePlaying={() => {
            const nextIsPlaying = !scenario.isPlaying;
            if (nextIsPlaying) {
              posthog.capture('playback_started', {
                trigger: 'play_pause',
                ...getScenarioAnalyticsProps(scenario.frames, scenario.currentFrameIndex),
              });
            }
            scenario.setIsPlaying(nextIsPlaying);
          }}
          onStepBackward={scenario.stepBackward}
          onStepForward={scenario.stepForward}
          onReplayFromStart={() => {
            posthog.capture('playback_started', {
              trigger: 'replay',
              ...getScenarioAnalyticsProps(scenario.frames, 0),
            });
            scenario.replayFromStart();
          }}
          onSetPlaySpeed={scenario.setPlaySpeed}
          playSpeed={scenario.playSpeed}
          onUndo={scenario.undo}
          onPanCanvasBy={viewport.panCanvasBy}
          onOpenControls={() => setIsSidebarOpen(true)}
          onCloseControls={() => setIsSidebarOpen(false)}
          onSelectObject={scenario.selectObject}
          inspectorRequest={inspectorRequest}
          onSnapPreview={gridSnap.setSnapPreview}
          onZoomIn={() => viewport.zoomCanvasFromCenter(CANVAS_ZOOM_STEP)}
          onZoomOut={() => viewport.zoomCanvasFromCenter(1 / CANVAS_ZOOM_STEP)}
          onAutoZoom={() => viewport.fitCanvasToContent(visibleCanvasContentRect)}
          onResetZoom={viewport.resetCanvasZoom}
          selectedId={scenario.selectedId}
          selectedType={scenario.selectedType}
          selectedBoat={scenario.selectedBoat}
          selectedMark={scenario.selectedMark}
          selectedConnection={scenario.selectedConnection}
          selectedArrow={scenario.selectedArrow}
          selectedComment={scenario.selectedComment}
          selectedImage={scenario.selectedImage}
          updateBoat={scenario.updateBoat}
          updateActiveFrame={scenario.updateActiveFrame}
          updateMark={scenario.updateMark}
          updateMarkRoomZone={scenario.updateMarkRoomZone}
          updateConnection={scenario.updateConnection}
          updateArrow={scenario.updateArrow}
          updateComment={scenario.updateComment}
          updateRuleComment={scenario.updateRuleComment}
          updateImage={scenario.updateImage}
          canvasWrapRef={viewport.canvasWrapRef}
          handleCanvasTouchEnd={viewport.handleCanvasTouchEnd}
          handleCanvasTouchMove={viewport.handleCanvasTouchMove}
          handleCanvasTouchStart={viewport.handleCanvasTouchStart}
          showGrid={showGrid}
          snapTarget={gridSnap.snapTarget}
          stageRef={viewport.stageRef}
          stageSize={viewport.stageSize}
        />

      </section>

      {exportState.isExporting && (
        <ExportOverlay
          exportPhase={exportState.exportPhase}
          exportProgress={exportState.exportProgress}
          exportType={exportState.exportType}
        />
      )}

      {isNewScenarioDialogOpen && (
        <NewScenarioDialog
          returnFocusRef={modalReturnFocusRef}
          onCancel={() => setIsNewScenarioDialogOpen(false)}
          onExportAndContinue={handleExportAndStartNewScenario}
          onDiscard={resetToNewScenario}
        />
      )}

      {templateContributionMode && (
        <TemplateContributionDialog
          key={`${templateContributionMode}-${loadedTemplateId ?? 'new'}`}
          mode={templateContributionMode}
          frames={scenario.frames}
          initialTitle={scenario.settings.title ?? loadedTemplate?.title ?? 'Untitled situation'}
          existingTemplateIds={situationTemplates.map((template) => template.id)}
          templateId={loadedTemplate?.id}
          repository={templateRepository}
          returnFocusRef={modalReturnFocusRef}
          onClose={() => setTemplateContributionMode(null)}
        />
      )}
    </main>
  );
}
