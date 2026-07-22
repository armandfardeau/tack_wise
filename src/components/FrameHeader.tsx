import styles from './FrameHeader.module.css';

interface FrameHeaderProps {
  frameName: string;
  frameIndex: number;
  frameCount: number;
  showTitle: boolean;
  showNumber: boolean;
}

export default function FrameHeader({
  frameName,
  frameIndex,
  frameCount,
  showTitle,
  showNumber,
}: FrameHeaderProps) {
  if (!showTitle && !showNumber) return null;

  return (
    <div className={styles.canvasFrameHeader} aria-label={`Frame ${frameIndex + 1} of ${frameCount}`}>
      {showTitle && <h2>{frameName}</h2>}
      {showNumber && <span>Frame {frameIndex + 1} of {frameCount}</span>}
    </div>
  );
}
