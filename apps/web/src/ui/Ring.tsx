import type { ReactNode } from "react";
import { cx } from "./cx";
import { strokeColor, type StrokeTone } from "./tones";
import styles from "./Ring.module.css";

/**
 * Score ring (implementation-plan.md §2.3): C = 2πr,
 * stroke-dashoffset = C × (1 − value/100), rotated -90° so it starts at 12h.
 *
 * The three sizes the prototype renders have hand-tuned geometry — kept
 * verbatim so the rings match pixel by pixel (e.g. r=26 → C≈163.4,
 * r=62 → C≈389.6). Other sizes fall back to proportional geometry.
 */
const PRESETS: Record<number, { box: number; r: number; strokeWidth: number }> = {
  44: { box: 64, r: 26, strokeWidth: 7 }, // insight detail "related score"
  48: { box: 64, r: 26, strokeWidth: 7 }, // biomarker detail "related score"
  60: { box: 64, r: 26, strokeWidth: 7 },
  120: { box: 140, r: 58, strokeWidth: 11 }, // score detail hero — 140px geometry scaled down
  140: { box: 140, r: 58, strokeWidth: 11 },
  150: { box: 150, r: 62, strokeWidth: 12 },
};

function geometryFor(size: number) {
  const preset = PRESETS[size];
  if (preset) return preset;
  const strokeWidth = Math.round(size * 0.08);
  return { box: size, strokeWidth, r: (size - strokeWidth) / 2 - 1 };
}

interface RingProps {
  /** Score 0–100. */
  value: number;
  /** Rendered size in px. 60, 140 and 150 use the prototype's exact geometry. */
  size?: number;
  tone?: StrokeTone;
  /** Centered overlay (the number, "/ 100" caption, etc.). */
  children?: ReactNode;
  className?: string;
}

export function Ring({ value, size = 60, tone = "good", children, className }: RingProps) {
  const { box, r, strokeWidth } = geometryFor(size);
  const center = box / 2;
  const clamped = Math.max(0, Math.min(100, value));
  const circumference = Math.round(2 * Math.PI * r * 10) / 10;
  const dashOffset = Math.round(circumference * (1 - clamped / 100) * 10) / 10;

  return (
    <div
      className={cx(styles.wrap, className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${clamped} out of 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${box} ${box}`}>
        <circle
          className={styles.track}
          cx={center}
          cy={center}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={strokeColor[tone]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      {children !== undefined && <div className={styles.center}>{children}</div>}
    </div>
  );
}
