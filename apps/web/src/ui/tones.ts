/**
 * Visual tones of the design system (implementation-plan.md §2.2).
 * `ai` is reserved for everything LLM-generated — always purple, always
 * labeled. `none` exists for measurements without a reference range (§5.3).
 */
export type FlagTone = "good" | "watch" | "alert";
export type StatusTone = FlagTone | "none";
export type PillTone = FlagTone | "ai" | "blue" | "ink";

/** Tones the prototype uses for SVG strokes (.stk-*). */
export type StrokeTone = FlagTone | "blue";

export const strokeColor: Record<StrokeTone, string> = {
  good: "var(--good)",
  watch: "var(--watch)",
  alert: "var(--alert)",
  blue: "var(--blue)",
};
