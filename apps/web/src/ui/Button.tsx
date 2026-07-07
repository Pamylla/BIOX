import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={cx(styles.btn, styles[variant], size === "lg" && styles.lg, className)}
      {...rest}
    />
  );
}
