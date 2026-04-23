import { describe, it, expect } from "vitest";
import {
  V0_DEFAULT,
  V0_MIN,
  V0_MAX,
  ANGLE_MIN,
  ANGLE_MAX,
  G,
  toRad,
  computeRange,
  computeFlightTime,
  computeMaxHeight,
  complementaryAngle,
  computeTrajectoryPoints,
} from "./useProjectile";

const V0 = V0_DEFAULT;

describe("toRad", () => {
  it("toRad(0) === 0", () => {
    expect(toRad(0)).toBe(0);
  });

  it("toRad(90) ≈ Math.PI / 2", () => {
    expect(toRad(90)).toBeCloseTo(Math.PI / 2);
  });

  it("toRad(45) ≈ Math.PI / 4", () => {
    expect(toRad(45)).toBeCloseTo(Math.PI / 4);
  });
});

describe("computeRange", () => {
  it("computeRange(0) === 0 (sin(0) = 0)", () => {
    expect(computeRange(0, V0)).toBe(0);
  });

  it("computeRange(90) ≈ 0 (sin(180°) = 0)", () => {
    expect(computeRange(90, V0)).toBeCloseTo(0);
  });

  it("computeRange(45) ≈ V0²/G ≈ 40.77 (max range, within 0.01)", () => {
    const expected = (V0 * V0) / G;
    expect(computeRange(45, V0)).toBeCloseTo(expected, 2);
  });

  it("computeRange(30) ≈ computeRange(60) (complementary symmetry, within 0.001)", () => {
    expect(Math.abs(computeRange(30, V0) - computeRange(60, V0))).toBeLessThan(0.001);
  });

  it("computeRange(45, 40) ≈ 4 * computeRange(45, 20) (v0² scaling, within 0.01)", () => {
    expect(computeRange(45, 40)).toBeCloseTo(4 * computeRange(45, 20), 2);
  });
});

describe("computeFlightTime", () => {
  it("computeFlightTime(0) === 0", () => {
    expect(computeFlightTime(0, V0)).toBe(0);
  });

  it("computeFlightTime(90) ≈ 2*V0/G ≈ 4.077 (within 0.01)", () => {
    const expected = (2 * V0) / G;
    expect(computeFlightTime(90, V0)).toBeCloseTo(expected, 2);
  });

  it("computeFlightTime(45) > 0", () => {
    expect(computeFlightTime(45, V0)).toBeGreaterThan(0);
  });
});

describe("computeMaxHeight", () => {
  it("computeMaxHeight(0) === 0", () => {
    expect(computeMaxHeight(0, V0)).toBe(0);
  });

  it("computeMaxHeight(90) ≈ V0²/(2G) ≈ 20.39 (within 0.01)", () => {
    const expected = (V0 * V0) / (2 * G);
    expect(computeMaxHeight(90, V0)).toBeCloseTo(expected, 2);
  });
});

describe("complementaryAngle", () => {
  it("complementaryAngle(30) === 60", () => {
    expect(complementaryAngle(30)).toBe(60);
  });

  it("complementaryAngle(45) === 45", () => {
    expect(complementaryAngle(45)).toBe(45);
  });

  it("complementaryAngle(0) === 90", () => {
    expect(complementaryAngle(0)).toBe(90);
  });
});

describe("computeTrajectoryPoints", () => {
  it("angle=0: returns [{x:0, y:0}] (degenerate)", () => {
    expect(computeTrajectoryPoints(0, V0)).toEqual([{ x: 0, y: 0 }]);
  });

  it("angle=90: returns [{x:0, y:0}] (degenerate)", () => {
    expect(computeTrajectoryPoints(90, V0)).toEqual([{ x: 0, y: 0 }]);
  });

  it("angle=45: returns array of 200 points (default numPoints)", () => {
    expect(computeTrajectoryPoints(45, V0)).toHaveLength(200);
  });

  it("angle=45: returns custom number of points when numPoints is specified", () => {
    expect(computeTrajectoryPoints(45, V0, 50)).toHaveLength(50);
    expect(computeTrajectoryPoints(45, V0, 100)).toHaveLength(100);
  });

  it("angle=45: first point is {x:0, y:0} (within 0.001)", () => {
    const points = computeTrajectoryPoints(45, V0);
    expect(points[0].x).toBeCloseTo(0, 3);
    expect(points[0].y).toBeCloseTo(0, 3);
  });

  it("angle=45: last point has y ≈ 0 (within 0.1) and x ≈ computeRange(45) (within 0.1)", () => {
    const points = computeTrajectoryPoints(45, V0);
    const last = points[points.length - 1];
    expect(last.y).toBeCloseTo(0, 1);
    expect(last.x).toBeCloseTo(computeRange(45, V0), 1);
  });

  it("angle=45: all y values >= 0", () => {
    const points = computeTrajectoryPoints(45, V0);
    for (const p of points) {
      expect(p.y).toBeGreaterThanOrEqual(0);
    }
  });

  it("angle=30 and angle=60: last point x values are approximately equal (symmetry, within 0.1)", () => {
    const points30 = computeTrajectoryPoints(30, V0);
    const points60 = computeTrajectoryPoints(60, V0);
    const lastX30 = points30[points30.length - 1].x;
    const lastX60 = points60[points60.length - 1].x;
    expect(Math.abs(lastX30 - lastX60)).toBeLessThan(0.1);
  });
});

describe("constants", () => {
  it("V0_DEFAULT === 20", () => {
    expect(V0_DEFAULT).toBe(20);
  });

  it("V0_MIN === 10", () => {
    expect(V0_MIN).toBe(10);
  });

  it("V0_MAX === 40", () => {
    expect(V0_MAX).toBe(40);
  });

  it("ANGLE_MIN === 0", () => {
    expect(ANGLE_MIN).toBe(0);
  });

  it("ANGLE_MAX === 90", () => {
    expect(ANGLE_MAX).toBe(90);
  });

  it("G === 9.81", () => {
    expect(G).toBe(9.81);
  });
});
