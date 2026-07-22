import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ChevronDown, ChevronRight, File as FileIcon, FilePlus, FolderOpen, GitPullRequest, LayoutTemplate, Search, Upload, X } from 'lucide-react';
import type { SituationTemplate } from '../data/situationTemplates';
import type { ExportOptions, ExportQuality, Theme } from '../types';
import { DEFAULT_EXPORT_QUALITY } from '../utils/exportSettings';
import ExportDialog from './ExportDialog';
import styles from './ExportActions.module.css';

interface ExportActionsProps {
  className?: string;
  isExporting: boolean;
  onNewScenario?: (returnFocusTarget: HTMLElement | null) => void;
  onExport: (options: ExportOptions) => void;
  onImportJson: (file: File) => void;
  onLoadTemplate?: (template: SituationTemplate) => void;
  onContributeTemplate?: (returnFocusTarget: HTMLElement | null) => void;
  onUpdateTemplate?: (returnFocusTarget: HTMLElement | null) => void;
  canUpdateTemplate?: boolean;
  templates?: SituationTemplate[];
  theme?: Theme;
  exportQuality?: ExportQuality;
  onExportQualityChange?: (quality: ExportQuality) => void;
}

export default function ExportActions({
  className = 'export-actions',
  isExporting,
  onNewScenario,
  onExport,
  onImportJson,
  onLoadTemplate,
  onContributeTemplate,
  onUpdateTemplate,
  canUpdateTemplate = false,
  templates = [],
  theme = 'dark',
  exportQuality = DEFAULT_EXPORT_QUALITY,
  onExportQualityChange = () => undefined,
}: ExportActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<'templates' | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const filteredTemplates = templates.filter((template) => template.title.toLowerCase().includes(templateSearch.trim().toLowerCase()));

  useEffect(() => {
    if (!isFileMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!fileMenuRef.current?.contains(event.target as Node)) {
        setIsFileMenuOpen(false);
        setOpenSubmenu(null);
        setTemplateSearch('');
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFileMenuOpen(false);
        setOpenSubmenu(null);
        setTemplateSearch('');
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFileMenuOpen]);

  useEffect(() => {
    if (isExporting) {
      setIsFileMenuOpen(false);
      setOpenSubmenu(null);
      setIsExportDialogOpen(false);
      setTemplateSearch('');
    }
  }, [isExporting]);

  const handleImportChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onImportJson(file);
  };

  const closeFileMenu = () => {
    setIsFileMenuOpen(false);
    setOpenSubmenu(null);
    setTemplateSearch('');
  };

  const closeTemplateSubmenu = () => {
    setOpenSubmenu(null);
    setTemplateSearch('');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    closeFileMenu();
  };

  const closeAfterExport = (exportAction: (returnFocusTarget: HTMLElement | null) => void) => {
    exportAction(fileMenuTriggerRef.current);
    closeFileMenu();
  };

  const openExportDialog = () => {
    closeFileMenu();
    setIsExportDialogOpen(true);
  };

  return (
    <div className={[styles.exportActions, className].filter(Boolean).join(' ')}>
      <div ref={fileMenuRef} className={styles.fileDropdown}>
        <button
          ref={fileMenuTriggerRef}
          type="button"
          className={`${styles.actionButton} ${styles.fileMenuTrigger}`}
          aria-expanded={isFileMenuOpen}
          aria-haspopup="menu"
          aria-label="File options"
          onClick={() => {
            setIsFileMenuOpen((isOpen) => {
              if (isOpen) setTemplateSearch('');
              return !isOpen;
            });
            setOpenSubmenu(null);
          }}
          disabled={isExporting}
        >
          <span className={styles.actionIcon} aria-hidden="true"><FileIcon size={16} /></span>
          <span className="action-label">File</span>
          <span className={styles.fileMenuChevron} aria-hidden="true"><ChevronDown size={14} /></span>
        </button>
        {isFileMenuOpen && <div className={styles.fileDropdownMenu} role="menu" aria-label="File options">
          {onNewScenario && <button type="button" className={`${styles.actionButton} ${styles.fileMenuItem}`} role="menuitem" title="Create a new diagram" onClick={() => closeAfterExport(onNewScenario)}>
            <span className={styles.actionIcon} aria-hidden="true"><FilePlus size={16} /></span>
            <span className="action-label">New diagram</span>
          </button>}
          {templates.length > 0 && <div className={styles.fileSubmenu}>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.fileSubmenuTrigger}`}
              role="menuitem"
              aria-expanded={openSubmenu === 'templates'}
              aria-haspopup="menu"
              onClick={() => {
                setOpenSubmenu((submenu) => submenu === 'templates' ? null : 'templates');
                if (openSubmenu === 'templates') setTemplateSearch('');
              }}
            >
              <span className={styles.actionIcon} aria-hidden="true"><LayoutTemplate size={16} /></span>
              <span className="action-label">Templates</span>
              <span className={styles.fileSubmenuChevron} aria-hidden="true"><ChevronRight size={14} /></span>
            </button>
            {openSubmenu === 'templates' && <>
              <button type="button" className={styles.templateSheetBackdrop} aria-label="Dismiss template sheet" onClick={closeTemplateSubmenu} />
              <div className={styles.fileSubmenuMenu} role="menu" aria-label="Templates">
                <div className={styles.templateSheetHeader}>
                  <span className={styles.templateSheetTitle}>Templates</span>
                  <button type="button" className={styles.templateSheetClose} aria-label="Close templates sheet" onClick={closeTemplateSubmenu}>
                    <X aria-hidden="true" size={18} />
                  </button>
                </div>
                {onContributeTemplate && <button type="button" className={`${styles.actionButton} ${styles.fileMenuItem} ${styles.templateContributeButton}`} role="menuitem" title="Submit the current diagram as a template" onClick={() => {
                  onContributeTemplate(fileMenuTriggerRef.current);
                  closeFileMenu();
                }}>
                  <span className={styles.actionIcon} aria-hidden="true"><GitPullRequest size={16} /></span>
                  <span className="action-label">Submit current diagram</span>
                </button>}
                {onUpdateTemplate && <button type="button" className={`${styles.actionButton} ${styles.fileMenuItem} ${styles.templateContributeButton}`} role="menuitem" title={canUpdateTemplate ? 'Update the loaded template through a pull request' : 'Load a built-in template to update it through a pull request'} disabled={!canUpdateTemplate} onClick={() => {
                  onUpdateTemplate(fileMenuTriggerRef.current);
                  closeFileMenu();
                }}>
                  <span className={styles.actionIcon} aria-hidden="true"><GitPullRequest size={16} /></span>
                  <span className="action-label">Update current template</span>
                </button>}
                {(onContributeTemplate || onUpdateTemplate) && <div className={styles.templateMenuDivider} role="separator" />}
                <div className={styles.templateSearch}>
                  <Search aria-hidden="true" size={15} />
                  <input
                    type="search"
                    className={styles.templateSearchInput}
                    aria-label="Search templates"
                    placeholder="Search templates"
                    value={templateSearch}
                    onChange={(event) => setTemplateSearch(event.target.value)}
                  />
                </div>
                <div className={styles.templateList}>
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={`${styles.actionButton} ${styles.fileMenuItem}`}
                      role="menuitem"
                      title={`Load ${template.title}`}
                      onClick={() => {
                        onLoadTemplate?.(template);
                        closeFileMenu();
                      }}
                    >
                      <span className={styles.actionIcon} aria-hidden="true"><LayoutTemplate size={16} /></span>
                      <span className="action-label">{template.title}</span>
                    </button>
                  ))}
                  {filteredTemplates.length === 0 && <div className={styles.templateSearchEmpty} role="status">No templates found</div>}
                </div>
              </div>
            </>}
          </div>}
          <button type="button" className={`${styles.actionButton} ${styles.fileMenuItem}`} role="menuitem" title="Import JSON" onClick={handleImportClick}>
            <span className={styles.actionIcon} aria-hidden="true"><FolderOpen size={16} /></span>
            <span className="action-label">Import JSON</span>
          </button>
          <div className={styles.fileSubmenu}>
            <button type="button" className={`${styles.actionButton} ${styles.fileSubmenuTrigger}`} role="menuitem" onClick={openExportDialog}>
              <span className={styles.actionIcon} aria-hidden="true"><Upload size={16} /></span>
              <span className="action-label">Export</span>
            </button>
          </div>
        </div>}
      </div>
      {isExportDialogOpen && <ExportDialog
        theme={theme}
        exportQuality={exportQuality}
        onExportQualityChange={onExportQualityChange}
        returnFocusRef={fileMenuTriggerRef}
        onCancel={() => setIsExportDialogOpen(false)}
        onExport={(options) => {
          setIsExportDialogOpen(false);
          onExport(options);
        }}
      />}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        aria-label="Import scenario JSON file"
        onChange={handleImportChange}
        hidden
      />
    </div>
  );
}
