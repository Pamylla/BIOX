import { strokeColor, type StrokeTone } from "./tones";

interface SparklineProps {
  /** Series in chronological order; needs at least 2 points to draw. */
  values: ReadonlyArray<number>;
  tone?: StrokeTone;
  /** Coordinate space — the prototype uses 60×20 (rows) and 300×90 (trend cards). */
  viewBoxWidth?: number;
  viewBoxHeight?: number;
  strokeWidth?: number;
  /** Filled circle on the last point (trend cards). */
  endDot?: boolean;
  /** Rendered size; defaults to filling the container width. */
  width?: number | string;
  height?: number | string;
  className?: string;
}

/**
 * Hand-rolled sparkline (decision D6 — no chart lib). Values are normalized
 * into the viewBox with padding so the rounded stroke never clips; a flat
 * series renders as a centered horizontal line.
 */
export function Sparkline({
  values,
  tone = "good",
  viewBoxWidth = 60,
  viewBoxHeight = 20,
  strokeWidth = 1.8,
  endDot = false,
  width = "100%",
  height,
  className,
}: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const pad = strokeWidth + (endDot ? 4 : 1);

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * (viewBoxWidth - 2 * pad) + pad;
    const normalized = span === 0 ? 0.5 : (value - min) / span;
    const y = pad + (1 - normalized) * (viewBoxHeight - 2 * pad);
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height ?? viewBoxHeight}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="none"
      fill="none"
      className={className}
      aria-hidden
    >
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        stroke={strokeColor[tone]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {endDot && last && <circle cx={last.x} cy={last.y} r={4} fill={strokeColor[tone]} />}
    </svg>
  );
}
