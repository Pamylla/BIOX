import { BIOMARKER_SEED } from "@biox/shared";

/**
 * Placeholder shell. Replaced by the design system (Phase 1) and the 12 real
 * screens (Phase 2). It imports from @biox/shared purely to prove the shared
 * deterministic core is wired into the web bundle.
 */
export function App() {
  return (
    <main style={{ padding: "40px", maxWidth: "640px" }}>
      <span className="k">Health intelligence</span>
      <h1 className="disp" style={{ margin: "8px 0 4px" }}>
        BIOX
      </h1>
      <p className="muted">
        Turning laboratory results into an evolving, evidence-based health timeline.
      </p>
      <p className="muted">
        Deterministic core online — <strong className="mono">{BIOMARKER_SEED.length}</strong>{" "}
        biomarkers seeded in <code>@biox/shared</code>.
      </p>
    </main>
  );
}
