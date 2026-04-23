import { useState } from "react";

// ── Constants ────────────────────────────────────────────────────────
export const G = 9.81; // m/s², gravity
export const V0_DEFAULT = 20; // m/s, default launch speed
export const V0_MIN = 10;
export const V0_MAX = 40;
export const ANGLE_MIN = 0;
export const ANGLE_MAX = 90;
export const MAX_GHOSTS = 8;

// ── Types ────────────────────────────────────────────────────────────

export interface GhostShot {
  angle: number;
  v0: number;
}

// ── Pure physics helpers ─────────────────────────────────────────────

/** Convert degrees → radians. */
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Horizontal range: R = v0² sin(2θ) / G */
export function computeRange(angleDeg: number, v0: number): number {
  const theta = toRad(angleDeg);
  return (v0 * v0 * Math.sin(2 * theta)) / G;
}

/** Total flight time: T = 2 v0 sin(θ) / G */
export function computeFlightTime(angleDeg: number, v0: number): number {
  const theta = toRad(angleDeg);
  return (2 * v0 * Math.sin(theta)) / G;
}

/** Maximum height: H = (v0 sinθ)² / (2G) */
export function computeMaxHeight(angleDeg: number, v0: number): number {
  const theta = toRad(angleDeg);
  const sinTheta = Math.sin(theta);
  return (v0 * sinTheta * (v0 * sinTheta)) / (2 * G);
}

/** Complementary angle: 90 − θ */
export function complementaryAngle(angleDeg: number): number {
  return 90 - angleDeg;
}

/**
 * Sample evenly-spaced points along the parabolic trajectory.
 * Returns world-space `{ x, y }` pairs.
 * Degenerate cases (angle = 0 or 90) return a single origin point.
 */
export function computeTrajectoryPoints(
  angleDeg: number,
  v0: number,
  numPoints = 200,
): { x: number; y: number }[] {
  const range = computeRange(angleDeg, v0);
  const flightTime = computeFlightTime(angleDeg, v0);

  if (range < 1e-9 || flightTime < 1e-9) {
    return [{ x: 0, y: 0 }];
  }

  const theta = toRad(angleDeg);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const dt = flightTime / (numPoints - 1);
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const t = dt * i;
    const x = v0 * cosTheta * t;
    const y = v0 * sinTheta * t - 0.5 * G * t * t;
    points.push({ x, y: Math.max(0, y) });
  }

  return points;
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useProjectile() {
  const [angle, setAngle] = useState(45);
  const [v0, setV0] = useState(V0_DEFAULT);
  const [animationKey, setAnimationKey] = useState(0);

  function launch() {
    setAnimationKey((k) => k + 1);
  }

  return { angle, setAngle, v0, setV0, animationKey, launch } as const;
}
