import type { HTMLAttributes } from "react";
import { cx } from "./cx";
import type { StatusTone } from "./tones";
import styles from "./Trend.module.css";

interface TrendProps extends HTMLAttributes<HTMLSpanElement> {
  /** `none` renders in the muted "flat" color. */
  tone: StatusTone;
}

/** Mono trend caption ("▲ +6", "+3 since January"). Callers compose content. */
export function Trend({ tone, className, ...rest }: TrendProps) {
  return <span className={cx(styles.trend, styles[tone], className)} {...rest} />;
}

/** Arrow character for a trend direction, as the prototype renders it. */
export function trendArrow(direction: "up" | "down" | "flat"): string {
  return direction === "up" ? "▲" : direction === "down" ? "▼" : "—";
}
