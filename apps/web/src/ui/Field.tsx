import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import styles from "./Field.module.css";

interface FieldProps {
  label: string;
  /** Links the label to the control inside; pass the control's id. */
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

/** Labeled form row (prototype .field + .lbl). Stacks with 15px gaps. */
export function Field({ label, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.lbl} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Compact variant (prototype .inp-sm). */
  small?: boolean;
}

export function Input({ small, className, ...rest }: InputProps) {
  return <input className={cx(styles.inp, small && styles.sm, className)} {...rest} />;
}
