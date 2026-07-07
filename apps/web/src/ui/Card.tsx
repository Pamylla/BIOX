import type { HTMLAttributes } from "react";
import { cx } from "./cx";
import styles from "./Card.module.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Prototype padding variants: .pad (md) and .pad-lg (lg). */
  padding?: "none" | "md" | "lg";
}

export function Card({ padding = "md", className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        styles.card,
        padding === "md" && styles.pad,
        padding === "lg" && styles.padLg,
        className,
      )}
      {...rest}
    />
  );
}

/** Card section title (prototype .ct). */
export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cx(styles.title, className)} {...rest} />;
}
