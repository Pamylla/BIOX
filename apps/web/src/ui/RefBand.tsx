import { cx } from "./cx";
import type { StatusTone } from "./tones";
import styles from "./RefBand.module.css";

interface RefBandProps {
  /** Dot position along the band, 0–100 (%). */
  position: number;
  tone: StatusTone;
  /** Band thickness; the biomarker detail hero uses 10px with a 13px dot. */
  height?: number;
  dotSize?: number;
  /** Renders the Low / Reference range / High captions under the band. */
  labels?: boolean;
  className?: string;
}

/**
 * Reference-range band with a positional dot. Per §5.3, a measurement with
 * no reference range (`tone: "none"`) renders no band at all.
 */
export function RefBand({
  position,
  tone,
  height = 7,
  dotSize = 11,
  labels = false,
  className,
}: RefBandProps) {
  if (tone === "none") return null;

  const clamped = Math.max(0, Math.min(100, position));

  return (
    <div className={className}>
      <div className={styles.band} style={height === 7 ? undefined : { height }}>
        <span
          className={cx(styles.dot, styles[tone])}
          style={{
            left: `${clamped}%`,
            ...(dotSize === 11 ? undefined : { width: dotSize, height: dotSize }),
          }}
        />
      </div>
      {labels && (
        <div className={styles.labs}>
          <span>Low</span>
          <span>Reference range</span>
          <span>High</span>
        </div>
      )}
    </div>
  );
}
