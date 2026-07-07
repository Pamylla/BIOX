import { useNavigate } from "react-router-dom";
import { Button, Icon } from "../ui";
import styles from "./Topbar.module.css";

interface TopbarProps {
  /** e.g. "Snapshot 04 · 14 Jun 2026" — the global batch context selector. */
  snapshotLabel: string;
}

export function Topbar({ snapshotLabel }: TopbarProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.topbar}>
      <button type="button" className={styles.snapsel} onClick={() => navigate("/timeline")}>
        <span className={styles.snapdot} />
        {snapshotLabel}
        <Icon name="chevronDown" size={13} className="faint" />
      </button>

      {/* Search is post-MVP (§5.10): disabled field with a tooltip. */}
      <div className={styles.tsearch} title="Search is coming soon" aria-disabled>
        <Icon name="search" size={15} />
        Search biomarkers, insights…
      </div>

      <div className="f1" />

      <Button variant="ghost" onClick={() => navigate("/timeline")}>
        <Icon name="plus" size={15} />
        Compare
      </Button>
      <Button onClick={() => navigate("/upload")}>
        <Icon name="plusSmall" size={15} />
        Upload report
      </Button>
    </div>
  );
}
