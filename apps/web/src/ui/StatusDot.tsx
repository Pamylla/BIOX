import type { HTMLAttributes } from "react";
import { cx } from "./cx";
import type { StatusTone } from "./tones";
import styles from "./StatusDot.module.css";

interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone;
}

export function StatusDot({ tone, className, ...rest }: StatusDotProps) {
  return <span aria-hidden className={cx(styles.sdot, styles[tone], className)} {...rest} />;
}
