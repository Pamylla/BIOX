import type { HTMLAttributes } from "react";
import { cx } from "./cx";
import styles from "./Avatar.module.css";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  /** Full name; the avatar shows the initials (MVP has no photo upload). */
  name: string;
}

/** First letter of the first and last words: "Marina Alves" → "MA". */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, className, ...rest }: AvatarProps) {
  return (
    <div className={cx(styles.av, className)} aria-hidden {...rest}>
      {initialsOf(name)}
    </div>
  );
}
