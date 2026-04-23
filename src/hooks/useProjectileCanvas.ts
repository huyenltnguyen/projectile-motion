import { useEffect, useRef } from 'react';
import {
  computeTrajectoryPoints,
  computeRange,
  computeFlightTime,
  toRad,
  V0_MAX,
  G,
  type GhostShot,
} from './useProjectile';

// ── Design tokens ────────────────────────────────────────────────────
const COLOR_BLUE = '#99c9ff';
const COLOR_MUTED = '#858591';
const COLOR_BORDER = '#3b3b4f';
const COLOR_SURFACE = '#0a0a23';
const COLOR_GREEN = '#acd157';
const COLOR_TEXT = '#e4e4e7';
const FONT = "bold 13px 'Lato', sans-serif";
const FONT_SMALL = "13px 'Lato', sans-serif";

// ── Canvas layout constants ──────────────────────────────────────────
const PAD_LEFT = 56;
const PAD_RIGHT = 20;
const PAD_TOP = 32;
const PAD_BOTTOM = 48;

// ── World-space scale constants (fixed to V0_MAX) ─────────────────
const R_MAX_SCALE = (V0_MAX * V0_MAX) / G;
const H_MAX_SCALE = (V0_MAX * V0_MAX) / (2 * G);

// ── Interface ────────────────────────────────────────────────────────
interface UseProjectileCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  angle: number;
  v0: number;
  ghosts: GhostShot[];
  animationKey: number;
  isPlaying: boolean;
  onLivePosition: (x: number | null, y: number | null) => void;
  onAnimationComplete: (launchedAngle: number, launchedV0: number) => void;
  resizeCount: number;
}

// ── Coordinate transform ─────────────────────────────────────────────
function worldToCanvas(
  worldX: number,
  worldY: number,
  scaleX: number,
  scaleY: number,
  h: number,
): { cx: number; cy: number } {
  return {
    cx: PAD_LEFT + worldX * scaleX,
    cy: h - PAD_BOTTOM - worldY * scaleY,
  };
}

function getScale(w: number, h: number) {
  return {
    scaleX: (w - PAD_LEFT - PAD_RIGHT) / R_MAX_SCALE,
    scaleY: (h - PAD_TOP - PAD_BOTTOM) / H_MAX_SCALE,
  };
}

// ── Draw helpers ──────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = COLOR_SURFACE;
  ctx.fillRect(0, 0, w, h);
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scaleX: number,
  scaleY: number,
): void {
  const groundY = h - PAD_BOTTOM;
  const plotRight = w - PAD_RIGHT;

  ctx.strokeStyle = COLOR_BORDER;
  ctx.lineWidth = 1;

  // Ground line
  ctx.beginPath();
  ctx.moveTo(PAD_LEFT, groundY);
  ctx.lineTo(plotRight, groundY);
  ctx.stroke();

  // Y-axis
  ctx.beginPath();
  ctx.moveTo(PAD_LEFT, groundY);
  ctx.lineTo(PAD_LEFT, PAD_TOP);
  ctx.stroke();

  // X-axis tick labels
  ctx.fillStyle = COLOR_TEXT;
  ctx.font = FONT_SMALL;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const xTicks = [0, 40, 80, 120, 160];
  for (const val of xTicks) {
    const px = PAD_LEFT + val * scaleX;
    if (px > plotRight + 1) continue;
    ctx.beginPath();
    ctx.moveTo(px, groundY);
    ctx.lineTo(px, groundY + 5);
    ctx.strokeStyle = COLOR_BORDER;
    ctx.stroke();
    ctx.fillStyle = COLOR_TEXT;
    ctx.fillText(`${val}`, px, groundY + 8);
  }

  // Y-axis tick labels
  const yTicks = [0, 20, 40, 60, 80];
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const val of yTicks) {
    const py = groundY - val * scaleY;
    if (py < PAD_TOP - 1) continue;
    ctx.beginPath();
    ctx.moveTo(PAD_LEFT, py);
    ctx.lineTo(PAD_LEFT - 5, py);
    ctx.strokeStyle = COLOR_BORDER;
    ctx.stroke();
    ctx.fillStyle = COLOR_TEXT;
    ctx.fillText(`${val}`, PAD_LEFT - 8, py);
  }

  // Axis label: "Distance (m)"
  ctx.font = FONT_SMALL;
  ctx.fillStyle = COLOR_TEXT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    'Distance (m)',
    PAD_LEFT + (plotRight - PAD_LEFT) / 2,
    groundY + 26,
  );

  // Axis label: "Height (m)" rotated
  ctx.save();
  const labelX = 14;
  const labelY = PAD_TOP + (groundY - PAD_TOP) / 2;
  ctx.translate(labelX, labelY);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Height (m)', 0, 0);
  ctx.restore();
}

function drawArc(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  color: string,
  alpha: number,
  lineWidth: number,
  scaleX: number,
  scaleY: number,
  h: number,
): void {
  if (points.length <= 1) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();

  const first = worldToCanvas(points[0].x, points[0].y, scaleX, scaleY, h);
  ctx.moveTo(first.cx, first.cy);

  for (let i = 1; i < points.length; i++) {
    const p = worldToCanvas(points[i].x, points[i].y, scaleX, scaleY, h);
    ctx.lineTo(p.cx, p.cy);
  }

  ctx.stroke();
  ctx.restore();
}

function drawAngleIndicator(
  ctx: CanvasRenderingContext2D,
  angle: number,
  h: number,
): void {
  const originX = PAD_LEFT;
  const originY = h - PAD_BOTTOM;
  const rad = toRad(angle);

  ctx.save();

  // Arc from 0° to angle
  ctx.strokeStyle = COLOR_GREEN;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(originX, originY, 30, 0, -rad, true);
  ctx.stroke();

  // Dashed launch direction line
  const dx = Math.cos(rad);
  const dy = -Math.sin(rad);
  const lineLen = 50;
  const endX = originX + lineLen * dx;
  const endY = originY + lineLen * dy;

  ctx.globalAlpha = 0.7;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label at fixed position: just above ground, near origin — never overlaps arc
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLOR_GREEN;
  ctx.font = FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`θ = ${angle}°`, PAD_LEFT + 55, h - PAD_BOTTOM - 8);

  ctx.restore();
}

function drawGhosts(
  ctx: CanvasRenderingContext2D,
  ghosts: GhostShot[],
  scaleX: number,
  scaleY: number,
  h: number,
): void {
  const count = ghosts.length;
  if (count === 0) return;

  for (let i = 0; i < count; i++) {
    const { angle: ga, v0: gv0 } = ghosts[i];
    const points = computeTrajectoryPoints(ga, gv0, 100);
    const alpha = count === 1 ? 0.4 : 0.15 + (0.4 - 0.15) * (i / (count - 1));
    drawArc(ctx, points, COLOR_MUTED, alpha, 1.5, scaleX, scaleY, h);
  }
}

function drawBallAt(
  ctx: CanvasRenderingContext2D,
  worldX: number,
  worldY: number,
  scaleX: number,
  scaleY: number,
  h: number,
): void {
  const { cx, cy } = worldToCanvas(worldX, worldY, scaleX, scaleY, h);
  ctx.save();
  ctx.fillStyle = COLOR_BLUE;
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLandingDot(
  ctx: CanvasRenderingContext2D,
  angleDeg: number,
  v0: number,
  scaleX: number,
  scaleY: number,
  h: number,
): void {
  const range = computeRange(angleDeg, v0);
  const { cx, cy } = worldToCanvas(range, 0, scaleX, scaleY, h);
  ctx.save();
  ctx.fillStyle = COLOR_BLUE;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useProjectileCanvas({
  canvasRef,
  angle,
  v0,
  ghosts,
  animationKey,
  isPlaying,
  onLivePosition,
  onAnimationComplete,
  resizeCount,
}: UseProjectileCanvasProps): void {
  // Sync refs for values used inside rAF loop
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const onLivePositionRef = useRef(onLivePosition);
  onLivePositionRef.current = onLivePosition;

  const onAnimationCompleteRef = useRef(onAnimationComplete);
  onAnimationCompleteRef.current = onAnimationComplete;

  // Animation state refs
  const elapsedRef = useRef(0);
  const lastTimestampRef = useRef<number | null>(null);
  const rafIdRef = useRef(0);
  const animationActiveRef = useRef(false);
  const animationDoneRef = useRef(false);
  const prevKeyRef = useRef(-1);
  const launchedAngleRef = useRef(angle);
  const launchedV0Ref = useRef(v0);

  // ── Effect A: Animation lifecycle (restarts on new animationKey) ───
  useEffect(() => {
    if (animationKey === 0) return; // no animation yet

    const isNewAnimation = animationKey !== prevKeyRef.current;
    prevKeyRef.current = animationKey;

    if (!isNewAnimation) return;

    // Cancel any previous animation
    cancelAnimationFrame(rafIdRef.current);

    // Capture launched params
    launchedAngleRef.current = angle;
    launchedV0Ref.current = v0;

    // Reset animation state
    elapsedRef.current = 0;
    lastTimestampRef.current = null;
    animationDoneRef.current = false;
    animationActiveRef.current = true;

    const duration = Math.max(computeFlightTime(angle, v0) * 1000, 800);
    const points = computeTrajectoryPoints(angle, v0, 200);
    const rad = toRad(angle);
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    function animate(timestamp: number) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (w === 0 || h === 0) {
        rafIdRef.current = requestAnimationFrame(animate);
        return;
      }

      // Advance elapsed only when playing
      if (lastTimestampRef.current !== null && isPlayingRef.current) {
        elapsedRef.current += timestamp - lastTimestampRef.current;
      }
      lastTimestampRef.current = timestamp;

      const progress = Math.min(elapsedRef.current / duration, 1);
      const { scaleX, scaleY } = getScale(w, h);

      // Physics-exact live position
      const tSec = (progress * duration) / 1000;
      const liveX = launchedV0Ref.current * cosA * tSec;
      const liveY = Math.max(
        0,
        launchedV0Ref.current * sinA * tSec - 0.5 * G * tSec * tSec,
      );

      // Draw scene
      drawBackground(ctx, w, h);
      drawAxes(ctx, w, h, scaleX, scaleY);
      drawGhosts(ctx, ghosts, scaleX, scaleY, h);
      drawAngleIndicator(ctx, launchedAngleRef.current, h);

      if (progress < 1) {
        // Draw trail up to current position
        const trailIdx = Math.min(
          Math.floor(progress * (points.length - 1)),
          points.length - 1,
        );
        if (trailIdx > 0) {
          drawArc(ctx, points.slice(0, trailIdx + 1), COLOR_BLUE, 1, 2, scaleX, scaleY, h);
        }
        drawBallAt(ctx, liveX, liveY, scaleX, scaleY, h);
        onLivePositionRef.current(liveX, liveY);
        rafIdRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        drawArc(ctx, points, COLOR_BLUE, 1, 2, scaleX, scaleY, h);
        drawLandingDot(ctx, launchedAngleRef.current, launchedV0Ref.current, scaleX, scaleY, h);

        if (!animationDoneRef.current) {
          animationDoneRef.current = true;
          animationActiveRef.current = false;
          // Keep last live position (don't null it)
          onLivePositionRef.current(liveX, 0);
          onAnimationCompleteRef.current(
            launchedAngleRef.current,
            launchedV0Ref.current,
          );
        }
        // Don't request another frame — animation ended
      }
    }

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      animationActiveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationKey]);

  // ── Effect B: Static preview (runs when params change, not during animation) ───
  useEffect(() => {
    // Only block when actively playing — paused/cancelled animations should be overridden
    if (isPlayingRef.current) return;

    // Cancel any lingering RAF from a paused or interrupted animation
    cancelAnimationFrame(rafIdRef.current);
    animationActiveRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (w === 0 || h === 0) return;

    const { scaleX, scaleY } = getScale(w, h);

    drawBackground(ctx, w, h);
    drawAxes(ctx, w, h, scaleX, scaleY);
    drawGhosts(ctx, ghosts, scaleX, scaleY, h);
    drawAngleIndicator(ctx, angle, h);
    onLivePosition(null, null);
  }, [angle, v0, ghosts, resizeCount, canvasRef, onLivePosition]);
}
