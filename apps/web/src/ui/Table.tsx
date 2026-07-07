import type { TableHTMLAttributes } from "react";
import { cx } from "./cx";
import styles from "./Table.module.css";

/**
 * Styled table shell (prototype .table). Consumers compose regular
 * thead/tbody/th/td — the styling cascades from the root class.
 */
export function Table({ className, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cx(styles.table, className)} {...rest} />;
}
