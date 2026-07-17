import { useRef, type ChangeEvent } from 'react';

interface ExportActionsProps {
  className?: string;
  isExporting: boolean;
  onExport: (type: 'gif' | 'mp4') => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

export default function ExportActions({ className = 'export-actions', isExporting, onExport, onExportJson, onImportJson }: ExportActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onImportJson(file);
  };

  return (
    <div className={className}>
      <button type="button" className="action-btn import-btn" aria-label="Import JSON" onClick={() => fileInputRef.current?.click()} disabled={isExporting}>
        <span className="action-icon" aria-hidden="true">📂</span>
        <span className="action-label">Import JSON</span>
      </button>
      <button type="button" className="action-btn json-btn" aria-label="Export JSON" onClick={onExportJson} disabled={isExporting}>
        <span className="action-icon" aria-hidden="true">📄</span>
        <span className="action-label">Export JSON</span>
      </button>
      <button type="button" className="action-btn gif-btn" aria-label="Export GIF" onClick={() => onExport('gif')} disabled={isExporting}>
        <span className="action-icon" aria-hidden="true">📥</span>
        <span className="action-label">Export GIF</span>
      </button>
      <button type="button" className="action-btn mp4-btn" aria-label="Export Video (WebM)" onClick={() => onExport('mp4')} disabled={isExporting}>
        <span className="action-icon" aria-hidden="true">📹</span>
        <span className="action-label">Export Video (WebM)</span>
      </button>
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
