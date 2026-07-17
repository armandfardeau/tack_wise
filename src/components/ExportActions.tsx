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
      <button type="button" className="action-btn import-btn" onClick={() => fileInputRef.current?.click()} disabled={isExporting}>📂 Import JSON</button>
      <button type="button" className="action-btn json-btn" onClick={onExportJson} disabled={isExporting}>📄 Export JSON</button>
      <button type="button" className="action-btn gif-btn" onClick={() => onExport('gif')} disabled={isExporting}>📥 Export GIF</button>
      <button type="button" className="action-btn mp4-btn" onClick={() => onExport('mp4')} disabled={isExporting}>📹 Export Video (WebM)</button>
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
