interface WindHudProps {
  windAngle: number;
  windSpeed: number;
  onSelect: () => void;
}

export default function WindHud({ windAngle, windSpeed, onSelect }: WindHudProps) {
  return (
    <button
      type="button"
      className="wind-vane-container"
      aria-label="Select wind indicator"
      title="Select wind indicator; use canvas settings for wind options"
      onClick={onSelect}
    >
      <div className="wind-vane-dial">
        <svg
          className="wind-vane-needle"
          viewBox="0 0 100 100"
          style={{ transform: `rotate(${windAngle}deg)` }}
          aria-label={`Wind direction ${windAngle} degrees`}
        >
          <path d="M 50 80 L 50 50" stroke="#94a3b8" strokeWidth="4" />
          <path d="M 42 80 L 50 70 L 58 80 Z" fill="#94a3b8" />
          <path d="M 50 20 L 50 50" stroke="#ef4444" strokeWidth="6" />
          <polygon points="50,8 40,28 50,23 60,28" fill="#ef4444" />
          <circle cx="50" cy="50" r="7" fill="#f8fafc" stroke="#0f172a" strokeWidth="3" />
        </svg>
        <span className="compass-n">N</span>
        <span className="compass-s">S</span>
        <span className="compass-e">E</span>
        <span className="compass-w">W</span>
      </div>
      <div className="wind-vane-info">
        <span className="wind-vane-speed">{windSpeed} KTS</span>
        <span className="wind-vane-angle">{windAngle}°</span>
      </div>
    </button>
  );
}
