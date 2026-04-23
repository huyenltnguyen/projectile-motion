import styles from './FormulaReadout.module.css';

interface FormulaReadoutProps {
  angle: number;
  v0: number;
  range: number;
  maxHeight: number;
}

export function FormulaReadout({ angle, v0, range, maxHeight }: FormulaReadoutProps) {
  return (
    <div className={styles.container}>
      {/* Range formula */}
      <div className={styles.formulaBlock}>
        <span className={styles.mathExpr}>
          R =&nbsp;
          <span className={styles.frac}>
            <span className={styles.numer}>
              <span className={styles.blue}>
                v<sub>0</sub>
              </span>
              <sup>2</sup> · sin(2<span className={styles.green}>θ</span>)
            </span>
            <span className={styles.denom}>g</span>
          </span>
          =&nbsp;
          <span className={styles.frac}>
            <span className={styles.numer}>
              <span className={styles.blue}>{v0}</span>
              <sup>2</sup> · sin(2 · <span className={styles.green}>{angle}°</span>)
            </span>
            <span className={styles.denom}>9.81</span>
          </span>
          =&nbsp;
          <span className={styles.resultValue}>{range.toFixed(2)}</span>
          <span className={styles.unit}> m</span>
        </span>
      </div>

      <div className={styles.divider} />

      {/* Max height formula */}
      <div className={styles.formulaBlock}>
        <span className={styles.mathExpr}>
          H =&nbsp;
          <span className={styles.frac}>
            <span className={styles.numer}>
              <span className={styles.blue}>
                v<sub>0</sub>
              </span>
              <sup>2</sup> · sin<sup>2</sup>(<span className={styles.green}>θ</span>)
            </span>
            <span className={styles.denom}>2g</span>
          </span>
          =&nbsp;
          <span className={styles.frac}>
            <span className={styles.numer}>
              <span className={styles.blue}>{v0}</span>
              <sup>2</sup> · sin<sup>2</sup>(<span className={styles.green}>{angle}°</span>)
            </span>
            <span className={styles.denom}>2 × 9.81</span>
          </span>
          =&nbsp;
          <span className={styles.resultValue}>{maxHeight.toFixed(2)}</span>
          <span className={styles.unit}> m</span>
        </span>
      </div>
    </div>
  );
}
