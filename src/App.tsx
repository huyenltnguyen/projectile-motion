import { useCallback, useState } from 'react';
import styles from './App.module.css';
import { Header } from './components/Header/Header';
import { ProjectileCanvas } from './components/ProjectileCanvas/ProjectileCanvas';
import { SliderControl } from './components/SliderControl/SliderControl';
import { FormulaReadout } from './components/FormulaReadout/FormulaReadout';
import { StatsReadout } from './components/StatsReadout/StatsReadout';
import { ProjectileInfo } from './components/ProjectileInfo/ProjectileInfo';
import {
  useProjectile,
  computeRange,
  computeMaxHeight,
  ANGLE_MIN,
  ANGLE_MAX,
  V0_MIN,
  V0_MAX,
  MAX_GHOSTS,
  type GhostShot,
} from './hooks/useProjectile';

function InfoIconButton({
  expanded,
  controls,
  onClick,
}: {
  expanded: boolean;
  controls: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.infoIconBtn}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={expanded ? 'Hide notes' : 'Show notes'}
      onClick={onClick}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="12" y1="11" x2="12" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
      </svg>
    </button>
  );
}

type AnimationPhase = 'idle' | 'playing' | 'paused';

function App() {
  const { angle, setAngle, v0, setV0, animationKey, launch } = useProjectile();
  const [ghosts, setGhosts] = useState<GhostShot[]>([]);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [liveX, setLiveX] = useState<number | null>(null);
  const [liveY, setLiveY] = useState<number | null>(null);
  const [frozenX, setFrozenX] = useState<number | null>(null);
  const [frozenY, setFrozenY] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const range = computeRange(angle, v0);
  const maxHeight = computeMaxHeight(angle, v0);
  const isPlaying = animationPhase === 'playing';

  const handlePlayPause = () => {
    if (animationPhase === 'idle') {
      setLiveX(null);
      setLiveY(null);
      setFrozenX(null);
      setFrozenY(null);
      launch();
      setAnimationPhase('playing');
    } else if (animationPhase === 'playing') {
      setAnimationPhase('paused');
    } else {
      setAnimationPhase('playing');
    }
  };

  const handleLivePosition = useCallback((x: number | null, y: number | null) => {
    setLiveX(x);
    setLiveY(y);
    if (x !== null && y !== null) {
      setFrozenX(x);
      setFrozenY(y);
    }
  }, []);

  const handleAnimationComplete = useCallback(
    (launchedAngle: number, launchedV0: number) => {
      setAnimationPhase('idle');
      setGhosts((prev) => {
        const next = [...prev, { angle: launchedAngle, v0: launchedV0 }];
        return next.length > MAX_GHOSTS ? next.slice(next.length - MAX_GHOSTS) : next;
      });
    },
    [],
  );

  const handleAngleChange = (val: number) => {
    setAngle(val);
    setLiveX(null);
    setLiveY(null);
    setFrozenX(null);
    setFrozenY(null);
    if (animationPhase !== 'idle') {
      setAnimationPhase('idle');
    }
  };

  const handleV0Change = (val: number) => {
    setV0(val);
    setLiveX(null);
    setLiveY(null);
    setFrozenX(null);
    setFrozenY(null);
    if (animationPhase !== 'idle') {
      setAnimationPhase('idle');
    }
  };

  const handleClearGhosts = useCallback(() => {
    setGhosts([]);
  }, []);

  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <div className={styles.contentGrid}>
          {/* LEFT — main simulation area */}
          <div className={styles.mainArea}>
            <section className={styles.simulationArea} aria-label="Simulation">
              <div className={styles.canvasWrapper}>
                <ProjectileCanvas
                  angle={angle}
                  v0={v0}
                  ghosts={ghosts}
                  animationKey={animationKey}
                  isPlaying={isPlaying}
                  onLivePosition={handleLivePosition}
                  onAnimationComplete={handleAnimationComplete}
                />
                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    className={styles.playPauseBtn}
                    onClick={handlePlayPause}
                    aria-label={
                      animationPhase === 'playing'
                        ? 'Pause simulation'
                        : animationPhase === 'paused'
                          ? 'Resume simulation'
                          : 'Launch projectile'
                    }
                  >
                    {animationPhase === 'playing' ? '⏸' : '▶'}
                  </button>
                  <button
                    type="button"
                    className={styles.clearBtn}
                    onClick={handleClearGhosts}
                    aria-label="Reset ghost trails"
                    disabled={ghosts.length === 0}
                  >
                    ↻
                  </button>
                </div>
              </div>
            </section>

            <section className={styles.controlsArea} aria-label="Controls">
              <div className={styles.sliders}>
                <SliderControl
                  id="angle-slider"
                  label="Launch Angle"
                  unit="°"
                  value={angle}
                  min={ANGLE_MIN}
                  max={ANGLE_MAX}
                  onChange={handleAngleChange}
                  accentColor="green"
                  step={1}
                />
                <SliderControl
                  id="speed-slider"
                  label="Launch Speed"
                  unit="m/s"
                  value={v0}
                  min={V0_MIN}
                  max={V0_MAX}
                  onChange={handleV0Change}
                  accentColor="blue"
                  step={1}
                />
              </div>
            </section>

            <StatsReadout
              liveX={liveX}
              liveY={liveY}
              frozenX={frozenX}
              frozenY={frozenY}
              range={range}
              maxHeight={maxHeight}
            />

            <FormulaReadout angle={angle} v0={v0} range={range} maxHeight={maxHeight} />
          </div>

          {/* RIGHT — sidebar */}
          <aside className={styles.sidePanel}>
            <div className={styles.formulaRow}>
              <p
                className={styles.formulaDisplay}
                aria-label="Formula: R equals v-naught squared sin 2 theta divided by g"
              >
                <span className={styles.formulaVar}>R</span>
                {' = '}
                <span className={styles.formulaMathExpr}>
                  <span className={styles.formulaFrac}>
                    <span className={styles.formulaNumer}>
                      <span className={`${styles.formulaVar} ${styles.formulaAccentBlue}`}>v₀</span>
                      <sup>2</sup>
                      {' sin 2'}
                      <span className={`${styles.formulaVar} ${styles.formulaAccentGreen}`}>θ</span>
                    </span>
                    <span className={styles.formulaDenom}>g</span>
                  </span>
                </span>
              </p>
              <InfoIconButton
                expanded={showInfo}
                onClick={() => setShowInfo((s) => !s)}
                controls="info-panel"
              />
            </div>
            {showInfo && (
              <div id="info-panel">
                <ProjectileInfo />
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
