import { Outlet } from "react-router-dom";
import { useBatches, useInsights, useMe } from "../api";
import { snapshotLabel } from "../lib/format";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import styles from "./AppLayout.module.css";

/** Authenticated app frame: sidebar + topbar wrapping every screen. */
export function AppLayout() {
  const { data: me } = useMe();
  const { data: insights } = useInsights();
  const { data: batches } = useBatches();

  const latest = batches?.find((batch) => batch.isLatest);

  return (
    <div className={styles.app}>
      <Sidebar user={me} insightsBadge={insights?.unreadCount} />
      <div className={styles.main}>
        <Topbar
          snapshotLabel={latest ? snapshotLabel(latest.sequence, latest.collectedAt) : "Loading…"}
        />
        <Outlet />
      </div>
    </div>
  );
}
