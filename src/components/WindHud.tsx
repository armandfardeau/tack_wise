import styles from './WindHud.module.css';

interface WindHudProps {
  windAngle: number;
  windSpeed: number;
  onSelect?: () => void;
}

function normalizeBearing(angle: number) {
  return ((Math.round(angle) % 360) + 360) % 360;
}

function formatBearing(angle: number) {
  return normalizeBearing(angle).toString().padStart(3, '0');
}

export default function WindHud({ windAngle, windSpeed, onSelect }: WindHudProps) {
  const flowAngle = normalizeBearing(windAngle + 180);
  const fromBearing = formatBearing(windAngle);
  const towardBearing = formatBearing(flowAngle);

  return (
    <button
      type="button"
      className={styles.windVaneContainer}
      aria-label={`Edit wind direction and velocity. Wind blowing toward ${towardBearing} degrees from ${fromBearing} degrees at ${windSpeed} knots.`}
      title="Click to edit wind direction and velocity"
      onClick={onSelect}
    >
      <div className={styles.windVaneDial}>
        <svg
          className={styles.windVaneNeedle}
          viewBox="0 0 100 100"
          style={{ transform: `rotate(${flowAngle}deg)` }}
          aria-label={`Wind blowing toward ${flowAngle} degrees`}
        >
          <path d="M 50 78 L 50 25" stroke="#67e8f9" strokeWidth="8" strokeLinecap="round" />
          <polygon points="50,7 35,34 50,27 65,34" fill="#22d3ee" />
          <circle cx="50" cy="50" r="7" fill="#f8fafc" stroke="#083344" strokeWidth="3" />
        </svg>
        <span className={styles.compassN}>N</span>
        <span className={styles.compassS}>S</span>
        <span className={styles.compassE}>E</span>
        <span className={styles.compassW}>W</span>
      </div>
      <div className={styles.windVaneInfo}>
        <span className={styles.windVaneBearing}>TOWARD {towardBearing}°</span>
        <span className={styles.windVaneMeta}>FROM {fromBearing}° · {windSpeed} KTS</span>
      </div>
    </button>
  );
}
