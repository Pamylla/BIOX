import type { HTMLAttributes } from "react";
import { cx } from "./cx";
import type { PillTone } from "./tones";
import styles from "./Pill.module.css";

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone: PillTone;
}

export function Pill({ tone, className, ...rest }: PillProps) {
  return <span className={cx(styles.pill, styles[tone], className)} {...rest} />;
}
