import type { HTMLAttributes } from "react";
import { cx } from "./cx";

/**
 * Mono uppercase kicker label. Uses the global `.k` class from base.css —
 * the prototype applies it to arbitrary elements, so the class stays global
 * and this component is just the idiomatic way to reach it.
 */
export function Kicker({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("k", className)} {...rest} />;
}
