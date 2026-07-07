import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import styles from "./AppLayout.module.css";

// TODO(phase-2 data layer): user, unread insights count and the snapshot
// label all come from the ApiClient (MockApiClient first). These stand-ins
// exist only until that lands — screens must never hardcode counts (§2.4).
const INTERIM_USER = { name: "Marina Alves", email: "marina.alves@email.com" };
const INTERIM_SNAPSHOT_LABEL = "Snapshot 04 · 14 Jun 2026";
const INTERIM_INSIGHTS_BADGE = 3;

/** Authenticated app frame: sidebar + topbar wrapping every screen. */
export function AppLayout() {
  return (
    <div className={styles.app}>
      <Sidebar user={INTERIM_USER} insightsBadge={INTERIM_INSIGHTS_BADGE} />
      <div className={styles.main}>
        <Topbar snapshotLabel={INTERIM_SNAPSHOT_LABEL} />
        <Outlet />
      </div>
    </div>
  );
}
