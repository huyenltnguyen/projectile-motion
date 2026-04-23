import styles from './ProjectileInfo.module.css';

export function ProjectileInfo() {
  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Notes</h2>
      <ul className={styles.list}>
        <li>
          <strong>45° gives the longest range</strong> — The range formula is maximized when sin(2θ)
          reaches its peak value of 1, which happens at θ&nbsp;=&nbsp;45°.
        </li>
        <li>
          <strong>Complementary angles give equal range</strong> — Angles that add up to 90° produce
          the same horizontal range. For example, 30° and 60° land at the same spot because
          sin(2×30°)&nbsp;=&nbsp;sin(60°) &nbsp;=&nbsp;sin(2×60°).
        </li>
        <li>
          <strong>Ideal conditions assumed</strong> — This simulation assumes flat ground, no air
          resistance, and launch and landing at the same height.
        </li>
      </ul>
    </div>
  );
}
