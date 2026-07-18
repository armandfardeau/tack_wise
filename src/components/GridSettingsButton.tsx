interface GridSettingsButtonProps {
  onOpenInspector: () => void;
}

export default function GridSettingsButton({ onOpenInspector }: GridSettingsButtonProps) {
  return (
    <button
      type="button"
      className="canvas-settings-btn"
      aria-label="Open canvas settings"
      title="Open canvas settings"
      onClick={onOpenInspector}
    >
      ⚙️
    </button>
  );
}
