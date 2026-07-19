import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ChevronDown, ChevronRight, Download, File as FileIcon, FileCode, FilePlus, FileVideoCamera, FolderOpen, Image, LayoutTemplate, Search, Upload } from 'lucide-react';
import type { SituationTemplate } from '../data/situationTemplates';
import type { VideoExportType } from '../types';

interface ExportActionsProps {
  className?: string;
  isExporting: boolean;
  onExport: (type: 'gif' | VideoExportType) => void;
  onExportImage?: (type: 'png' | 'jpeg') => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onNewScenario?: () => void;
  onLoadTemplate?: (template: SituationTemplate) => void;
  readOnly?: boolean;
  templates?: SituationTemplate[];
}

export default function ExportActions({ className = 'export-actions', isExporting, onExport, onExportImage, onExportJson, onImportJson, onNewScenario, onLoadTemplate, readOnly = false, templates = [] }: ExportActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<'templates' | 'export' | null>(null);
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
    closeFileMenu();
  };

  const closeAfterExport = (exportAction: () => void) => {
    exportAction();
    closeFileMenu();
  };

  return (
    <div className={className}>
      <div ref={fileMenuRef} className="file-dropdown">
        <button
          type="button"
          className="action-btn file-menu-trigger"
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
          <span className="action-icon" aria-hidden="true"><FileIcon size={16} /></span>
          <span className="action-label">File</span>
          <span className="file-menu-chevron" aria-hidden="true"><ChevronDown size={14} /></span>
        </button>
        {isFileMenuOpen && <div className="file-dropdown-menu" role="menu" aria-label="File options">
          {!readOnly && <button type="button" className="action-btn file-menu-item new-btn" role="menuitem" title="New diagram" onClick={() => {
            onNewScenario?.();
            closeFileMenu();
          }}>
            <span className="action-icon" aria-hidden="true"><FilePlus size={16} /></span>
            <span className="action-label">New diagram</span>
          </button>}
          {!readOnly && templates.length > 0 && <div className="file-submenu">
            <button
              type="button"
              className="action-btn file-submenu-trigger"
              role="menuitem"
              aria-expanded={openSubmenu === 'templates'}
              aria-haspopup="menu"
              onClick={() => {
                setOpenSubmenu((submenu) => submenu === 'templates' ? null : 'templates');
                if (openSubmenu === 'templates') setTemplateSearch('');
              }}
            >
              <span className="action-icon" aria-hidden="true"><LayoutTemplate size={16} /></span>
              <span className="action-label">Templates</span>
              <span className="file-submenu-chevron" aria-hidden="true"><ChevronRight size={14} /></span>
            </button>
            {openSubmenu === 'templates' && <div className="file-submenu-menu" role="menu" aria-label="Templates">
              <div className="template-search">
                <Search aria-hidden="true" size={15} />
                <input
                  type="search"
                  className="template-search-input"
                  aria-label="Search templates"
                  placeholder="Search templates"
                  value={templateSearch}
                  onChange={(event) => setTemplateSearch(event.target.value)}
                />
              </div>
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="action-btn file-menu-item template-btn"
                  role="menuitem"
                  title={`Load ${template.title}`}
                  onClick={() => {
                    onLoadTemplate?.(template);
                    closeFileMenu();
                  }}
                >
                  <span className="action-icon" aria-hidden="true"><LayoutTemplate size={16} /></span>
                  <span className="action-label">{template.title}</span>
                </button>
              ))}
              {filteredTemplates.length === 0 && <div className="template-search-empty" role="status">No templates found</div>}
            </div>}
          </div>}
          {!readOnly && <button type="button" className="action-btn file-menu-item import-btn" role="menuitem" title="Import JSON" onClick={handleImportClick}>
              <span className="action-icon" aria-hidden="true"><FolderOpen size={16} /></span>
              <span className="action-label">Import JSON</span>
            </button>}
          <div className="file-submenu">
            <button
              type="button"
              className="action-btn file-submenu-trigger"
              role="menuitem"
              aria-expanded={openSubmenu === 'export'}
              aria-haspopup="menu"
              onClick={() => setOpenSubmenu((submenu) => submenu === 'export' ? null : 'export')}
            >
              <span className="action-icon" aria-hidden="true"><Upload size={16} /></span>
              <span className="action-label">Export</span>
              <span className="file-submenu-chevron" aria-hidden="true"><ChevronRight size={14} /></span>
            </button>
            {openSubmenu === 'export' && <div className="file-submenu-menu" role="menu" aria-label="Export options">
              <button type="button" className="action-btn file-menu-item json-btn" role="menuitem" title="Export JSON" onClick={() => closeAfterExport(onExportJson)}>
                <span className="action-icon" aria-hidden="true"><FileCode size={16} /></span>
                <span className="action-label">Export JSON</span>
              </button>
              <button type="button" className="action-btn file-menu-item gif-btn" role="menuitem" title="Export GIF" onClick={() => closeAfterExport(() => onExport('gif'))}>
                <span className="action-icon" aria-hidden="true"><Download size={16} /></span>
                <span className="action-label">Export GIF</span>
              </button>
              <button type="button" className="action-btn file-menu-item webm-btn" role="menuitem" title="Export Video (WEBM)" onClick={() => closeAfterExport(() => onExport('webm'))}>
                <span className="action-icon" aria-hidden="true"><FileVideoCamera size={16} /></span>
                <span className="action-label">Export Video (WEBM)</span>
              </button>
              <button type="button" className="action-btn file-menu-item mp4-btn" role="menuitem" title="Export Video (MP4)" onClick={() => closeAfterExport(() => onExport('mp4'))}>
                <span className="action-icon" aria-hidden="true"><FileVideoCamera size={16} /></span>
                <span className="action-label">Export Video (MP4)</span>
              </button>
              {onExportImage && <>
                <button type="button" className="action-btn file-menu-item image-btn" role="menuitem" title="Export PNG" onClick={() => closeAfterExport(() => onExportImage('png'))}>
                  <span className="action-icon" aria-hidden="true"><Image size={16} /></span>
                  <span className="action-label">Export PNG</span>
                </button>
                <button type="button" className="action-btn file-menu-item image-btn" role="menuitem" title="Export JPG" onClick={() => closeAfterExport(() => onExportImage('jpeg'))}>
                  <span className="action-icon" aria-hidden="true"><Image size={16} /></span>
                  <span className="action-label">Export JPG</span>
                </button>
              </>}
            </div>}
          </div>
        </div>}
      </div>
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
