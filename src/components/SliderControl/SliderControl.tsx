import styles from './SliderControl.module.css';

interface SliderControlProps {
  id: string;
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  accentColor: 'yellow' | 'purple' | 'blue' | 'green' | 'red';
  step?: number;
}

export function SliderControl({
  id,
  label,
  unit,
  value,
  min,
  max,
  onChange,
  accentColor,
  step,
}: SliderControlProps) {
  const accentClasses: Record<SliderControlProps['accentColor'], string> = {
    yellow: styles.accentYellow,
    purple: styles.accentPurple,
    blue: styles.accentBlue,
    green: styles.accentGreen,
    red: styles.accentRed,
  };

  return (
    <div className={styles.container}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <span className={styles.value}>
          {value} <span className={styles.unit}>{unit}</span>
        </span>
      </div>

      <div className={styles.sliderWrap}>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          value={value}
          step={step ?? 1}
          className={`${styles.slider} ${accentClasses[accentColor]}`}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} ${unit}`}
        />
        <div className={styles.tickRow}>
          <span className={styles.tick}>{min}</span>
          <span className={styles.tick}>{max}</span>
        </div>
      </div>
    </div>
  );
}
