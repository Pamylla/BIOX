import { BIOMARKER_SEED } from "@biox/shared";

/**
 * Placeholder shell. Replaced by the design system (Phase 1) and the 12 real
 * screens (Phase 2). It imports from @biox/shared purely to prove the shared
 * deterministic core is wired into the web bundle.
 */
export function App() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "40px", maxWidth: "640px" }}>
      <h1 style={{ marginBottom: "4px" }}>BIOX</h1>
      <p style={{ color: "#565D64" }}>
        Turning laboratory results into an evolving, evidence-based health timeline.
      </p>
      <p style={{ color: "#565D64" }}>
        Deterministic core online — <strong>{BIOMARKER_SEED.length}</strong> biomarkers seeded in{" "}
        <code>@biox/shared</code>.
      </p>
    </main>
  );
}
