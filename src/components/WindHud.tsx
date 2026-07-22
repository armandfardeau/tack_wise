import styles from './WindHud.module.css';

interface WindHudProps {
  windAngle: number;
  windSpeed: number;
  onSelect?: () => void;
}

export default function WindHud({ windAngle, windSpeed, onSelect }: WindHudProps) {
  const flowAngle = (windAngle + 180) % 360;
  const displayAngle = flowAngle < 0 ? flowAngle + 360 : flowAngle;

  return (
    <button
      type="button"
      className={styles.windVaneContainer}
      aria-label="Edit wind direction and velocity"
      title="Click to edit wind direction and velocity"
      onClick={onSelect}
    >
      <div className={styles.windVaneDial}>
        <svg
          className={styles.windVaneNeedle}
          viewBox="0 0 100 100"
          style={{ transform: `rotate(${displayAngle}deg)` }}
          aria-label={`Wind direction ${displayAngle} degrees`}
        >
          <path d="M 50 80 L 50 50" stroke="#94a3b8" strokeWidth="4" />
          <path d="M 42 80 L 50 70 L 58 80 Z" fill="#94a3b8" />
          <path d="M 50 20 L 50 50" stroke="#ef4444" strokeWidth="6" />
          <polygon points="50,8 40,28 50,23 60,28" fill="#ef4444" />
          <circle cx="50" cy="50" r="7" fill="#f8fafc" stroke="#0f172a" strokeWidth="3" />
        </svg>
        <span className={styles.compassN}>N</span>
        <span className={styles.compassS}>S</span>
        <span className={styles.compassE}>E</span>
        <span className={styles.compassW}>W</span>
      </div>
      <div className={styles.windVaneInfo}>
        <span className={styles.windVaneSpeed}>{windSpeed} KTS</span>
        <span className={styles.windVaneAngle}>{windAngle}°</span>
      </div>
    </button>
  );
}
