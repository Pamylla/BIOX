import { cx } from "./cx";
import styles from "./Skeleton.module.css";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

/** Pulsing placeholder block for loading states. */
export function Skeleton({ width = "100%", height = 16, className }: SkeletonProps) {
  return <div aria-hidden className={cx(styles.skeleton, className)} style={{ width, height }} />;
}
