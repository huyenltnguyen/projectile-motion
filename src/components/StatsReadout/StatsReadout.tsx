import styles from './StatsReadout.module.css';

interface StatsReadoutProps {
  liveX: number | null;
  liveY: number | null;
  frozenX: number | null;
  frozenY: number | null;
  range: number;
  maxHeight: number;
}

export function StatsReadout({
  liveX,
  liveY,
  frozenX,
  frozenY,
  range,
  maxHeight,
}: StatsReadoutProps) {
  const displayX = liveX ?? frozenX;
  const displayY = liveY ?? frozenY;

  return (
    <div className={styles.container} role="status">
      <div className={styles.item}>
        <span className={styles.label}>Range</span>
        <span className={styles.value}>{range.toFixed(1)}</span>
        <span className={styles.unit}>m</span>
      </div>

      <div className={styles.item}>
        <span className={styles.label}>Max height</span>
        <span className={styles.value}>{maxHeight.toFixed(1)}</span>
        <span className={styles.unit}>m</span>
      </div>

      <div className={styles.item}>
        <span className={styles.label}>Distance</span>
        <span className={styles.value}>
          {displayX !== null ? displayX.toFixed(1) : '—'}
        </span>
        <span className={styles.unit}>m</span>
      </div>

      <div className={styles.item}>
        <span className={styles.label}>Height</span>
        <span className={styles.value}>
          {displayY !== null ? displayY.toFixed(1) : '—'}
        </span>
        <span className={styles.unit}>m</span>
      </div>
    </div>
  );
}
