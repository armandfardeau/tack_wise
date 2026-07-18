import { useEffect, useRef, useState, type ChangeEvent } from 'react';

interface ExportActionsProps {
  className?: string;
  isExporting: boolean;
  onExport: (type: 'gif' | 'mp4') => void;
  onExportImage?: (type: 'png' | 'jpeg') => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

export default function ExportActions({ className = 'export-actions', isExporting, onExport, onExportImage, onExportJson, onImportJson }: ExportActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  useEffect(() => {
    if (!isExportMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!exportMenuRef.current?.contains(event.target as Node)) setIsExportMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExportMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExportMenuOpen]);

  useEffect(() => {
    if (isExporting) setIsExportMenuOpen(false);
  }, [isExporting]);

  const handleImportChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onImportJson(file);
  };

  const closeAfterExport = (exportAction: () => void) => {
    exportAction();
    setIsExportMenuOpen(false);
  };

  return (
    <div className={className}>
      <button type="button" className="action-btn import-btn" aria-label="Import JSON" onClick={() => fileInputRef.current?.click()} disabled={isExporting}>
        <span className="action-icon" aria-hidden="true">📂</span>
        <span className="action-label">Import JSON</span>
      </button>
      <div ref={exportMenuRef} className="export-dropdown">
        <button
          type="button"
          className="action-btn export-menu-trigger"
          aria-expanded={isExportMenuOpen}
          aria-haspopup="menu"
          aria-label="Export options"
          onClick={() => setIsExportMenuOpen((isOpen) => !isOpen)}
          disabled={isExporting}
        >
          <span className="action-icon" aria-hidden="true">📤</span>
          <span className="action-label">Export</span>
          <span className="export-menu-chevron" aria-hidden="true">⌄</span>
        </button>
        {isExportMenuOpen && <div className="export-dropdown-menu" role="menu" aria-label="Export options">
          <button type="button" className="action-btn export-menu-item json-btn" role="menuitem" onClick={() => closeAfterExport(onExportJson)}>
            <span className="action-icon" aria-hidden="true">📄</span>
            <span className="action-label">Export JSON</span>
          </button>
          <button type="button" className="action-btn export-menu-item gif-btn" role="menuitem" onClick={() => closeAfterExport(() => onExport('gif'))}>
            <span className="action-icon" aria-hidden="true">📥</span>
            <span className="action-label">Export GIF</span>
          </button>
          <button type="button" className="action-btn export-menu-item mp4-btn" role="menuitem" onClick={() => closeAfterExport(() => onExport('mp4'))}>
            <span className="action-icon" aria-hidden="true">📹</span>
            <span className="action-label">Export Video (WebM)</span>
          </button>
          {onExportImage && <>
            <button type="button" className="action-btn export-menu-item image-btn" role="menuitem" onClick={() => closeAfterExport(() => onExportImage('png'))}>
              <span className="action-icon" aria-hidden="true">🖼️</span>
              <span className="action-label">Export PNG</span>
            </button>
            <button type="button" className="action-btn export-menu-item image-btn" role="menuitem" onClick={() => closeAfterExport(() => onExportImage('jpeg'))}>
              <span className="action-icon" aria-hidden="true">🖼️</span>
              <span className="action-label">Export JPG</span>
            </button>
          </>}
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
