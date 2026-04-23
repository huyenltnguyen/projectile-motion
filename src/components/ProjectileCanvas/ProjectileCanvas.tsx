import { useEffect, useRef, useState } from 'react';
import styles from './ProjectileCanvas.module.css';
import { useProjectileCanvas } from '../../hooks/useProjectileCanvas';
import type { GhostShot } from '../../hooks/useProjectile';

interface ProjectileCanvasProps {
  angle: number;
  v0: number;
  ghosts: GhostShot[];
  animationKey: number;
  isPlaying: boolean;
  onLivePosition: (x: number | null, y: number | null) => void;
  onAnimationComplete: (launchedAngle: number, launchedV0: number) => void;
}

export function ProjectileCanvas({
  angle,
  v0,
  ghosts,
  animationKey,
  isPlaying,
  onLivePosition,
  onAnimationComplete,
}: ProjectileCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizeCount, setResizeCount] = useState(0);

  useProjectileCanvas({
    canvasRef,
    angle,
    v0,
    ghosts,
    animationKey,
    isPlaying,
    onLivePosition,
    onAnimationComplete,
    resizeCount,
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(container.clientWidth * dpr);
      canvas.height = Math.round(container.clientHeight * dpr);
      setResizeCount((c) => c + 1);
    });

    ro.observe(container);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(container.clientWidth * dpr);
    canvas.height = Math.round(container.clientHeight * dpr);

    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        role="img"
        aria-label={`Projectile arc at ${angle}° launch angle with speed ${v0} m/s`}
      />
    </div>
  );
}
