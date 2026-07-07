import { useNavigate, useSearchParams } from "react-router-dom";
import type { BatchSummary, BiomarkerRow, FlagStatus } from "@biox/shared/contracts";
import { useBatches, useBiomarkers, useCompare } from "../../api";
import { formatDate, formatMonthYear, formatSequence } from "../../lib/format";
import {
  Button,
  Card,
  CardTitle,
  Icon,
  Kicker,
  Pill,
  Skeleton,
  Sparkline,
  Table,
  Tabs,
  cx,
} from "../../ui";
import styles from "./TimelineScreen.module.css";

const TABS = [
  { value: "snapshots", label: "Snapshots" },
  { value: "compare", label: "Compare" },
  { value: "trends", label: "Trends" },
] as const;

type TimelineTab = (typeof TABS)[number]["value"];

export function TimelineScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const batches = useBatches();

  const rawTab = searchParams.get("tab");
  const tab: TimelineTab = rawTab === "compare" || rawTab === "trends" ? rawTab : "snapshots";

  const setParam = (updates: Record<string, string>) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(updates)) next.set(key, value);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <section className="content">
      <div className="page-h">
        <div>
          <Kicker>Overview · Evolution</Kicker>
          <h1 className="h1 disp">Timeline</h1>
          <div className="h1s">
            Every report becomes a snapshot on your history. Track how your health evolves — compare
            any two, or follow a single biomarker over time.
          </div>
        </div>
      </div>

      <Tabs
        aria-label="Timeline view"
        className={styles.tabs}
        tabs={TABS}
        value={tab}
        onChange={(next) => setParam({ tab: next })}
      />

      {batches.isPending && <Skeleton height={280} />}
      {batches.isError && (
        <Card padding="lg" className="fx ac gap12">
          <span className="muted">Couldn't load your snapshots.</span>
          <Button variant="ghost" onClick={() => void batches.refetch()}>
            Try again
          </Button>
        </Card>
      )}

      {batches.data && tab === "snapshots" && (
        <SnapshotsTab
          batches={batches.data}
          onCompare={(a, b) => setParam({ tab: "compare", a, b })}
        />
      )}
      {batches.data && tab === "compare" && (
        <CompareTab
          batches={batches.data}
          aParam={searchParams.get("a")}
          bParam={searchParams.get("b")}
          onSelect={(side, id) => setParam({ [side]: id })}
        />
      )}
      {batches.data && tab === "trends" && <TrendsTab batches={batches.data} />}
    </section>
  );
}

// --- Snapshots ---------------------------------------------------------------

interface SnapshotsTabProps {
  batches: BatchSummary[];
  onCompare: (aId: string, bId: string) => void;
}

function SnapshotsTab({ batches, onCompare }: SnapshotsTabProps) {
  const navigate = useNavigate();
  // Newest first, like the prototype spine.
  const ordered = [...batches].reverse();

  return (
    <div className={styles.spine}>
      {ordered.map((batch) => {
        const index = batches.findIndex((candidate) => candidate.id === batch.id);
        const previous = index > 0 ? batches[index - 1] : undefined;
        return (
          <div key={batch.id} className={styles.snapcard}>
            <span className={styles.snapdotbig} />
            <div className="f1">
              <div className="fx ac gap10">
                <span className={`mono faint ${styles.snapNum}`}>
                  SNAPSHOT {formatSequence(batch.sequence)}
                </span>
                {batch.isLatest && (
                  <Pill tone="ink" className={styles.tagPill}>
                    Latest
                  </Pill>
                )}
                {batch.isBaseline && (
                  <Pill tone="ink" className={styles.tagPill}>
                    Baseline
                  </Pill>
                )}
              </div>
              <div className={`disp ${styles.snapDate}`}>{formatDate(batch.collectedAt)}</div>
              <div className={`muted ${styles.snapSource}`}>
                {batch.performingLab} · {batch.markerCount} biomarkers
              </div>
            </div>
            <div className={styles.snapScore}>
              <b className="disp">{batch.overallScore ?? "—"}</b>
              <span>score</span>
            </div>
            <div className="fx gap8">
              <Button
                variant="ghost"
                onClick={() => onCompare((previous ?? batch).id, batch.id)}
                disabled={!previous}
              >
                <Icon name="plus" size={14} />
                Compare
              </Button>
              <Button onClick={() => navigate(`/?batch=${batch.id}`)}>View</Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Compare -------------------------------------------------------------------

interface CompareTabProps {
  batches: BatchSummary[];
  aParam: string | null;
  bParam: string | null;
  onSelect: (side: "a" | "b", id: string) => void;
}

function CompareTab({ batches, aParam, bParam, onSelect }: CompareTabProps) {
  if (batches.length < 2) {
    return (
      <Card padding="lg" className={styles.emptyNote}>
        <CardTitle>You need at least two snapshots to compare.</CardTitle>
        <p className="muted">Upload another report and come back here.</p>
      </Card>
    );
  }

  // Default: latest vs. the one before it (§5.9).
  const latest = batches[batches.length - 1]!;
  const previous = batches[batches.length - 2]!;
  const b = batches.find((batch) => batch.id === bParam) ?? latest;
  const a = batches.find((batch) => batch.id === aParam) ?? previous;

  return <CompareContent batches={batches} a={a} b={b} onSelect={onSelect} />;
}

function CompareContent({
  batches,
  a,
  b,
  onSelect,
}: {
  batches: BatchSummary[];
  a: BatchSummary;
  b: BatchSummary;
  onSelect: (side: "a" | "b", id: string) => void;
}) {
  const compare = useCompare(a.id, b.id);

  return (
    <>
      <div className={styles.cmpCols}>
        <div className={styles.cmpHd}>
          <Kicker>Biomarker</Kicker>
        </div>
        <div className={`${styles.cmpHd} ${styles.cmpHdB}`}>
          <span className={styles.cmpKick}>Snapshot {formatSequence(a.sequence)}</span>
          <select
            className={styles.cmpSelect}
            aria-label="Compare from snapshot"
            value={a.id}
            onChange={(event) => onSelect("a", event.target.value)}
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                Snapshot {formatSequence(batch.sequence)} — {formatDate(batch.collectedAt)}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.cmpHd}>
          <span className={cx(styles.cmpKick, b.isLatest && styles.cmpKickLatest)}>
            Snapshot {formatSequence(b.sequence)}
            {b.isLatest ? " · Latest" : ""}
          </span>
          <select
            className={styles.cmpSelect}
            aria-label="Compare to snapshot"
            value={b.id}
            onChange={(event) => onSelect("b", event.target.value)}
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                Snapshot {formatSequence(batch.sequence)} — {formatDate(batch.collectedAt)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {compare.isPending && <Skeleton height={320} />}
      {compare.data && (
        <>
          <Card padding="none" className="clip">
            <Table>
              <thead>
                <tr>
                  <th>Biomarker</th>
                  <th>{formatDate(a.collectedAt)}</th>
                  <th>{formatDate(b.collectedAt)}</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {compare.data.rows.map((row) => (
                  <tr key={row.biomarkerKey}>
                    <td className={styles.valueB}>{row.displayName}</td>
                    <td className={`muted mono ${styles.valueA}`}>
                      {row.valueA ?? "—"} {row.unit}
                    </td>
                    <td className={`mono ${styles.valueB}`}>
                      {row.valueB ?? "—"} {row.unit}
                    </td>
                    <td>
                      <span className={cx(styles.deltacell, deltaClass(row.deltaTone))}>
                        {formatDelta(row.delta)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
          <p className={`muted ${styles.cmpLegend}`}>
            <Icon name="infoCircle" size={14} className="faint" />
            Green changes are improvements; amber and red moved toward or past a threshold.
          </p>
        </>
      )}
    </>
  );
}

function deltaClass(tone: FlagStatus): string | false {
  if (tone === "good") return styles.deltaGood ?? false;
  if (tone === "watch") return styles.deltaWatch ?? false;
  if (tone === "alert") return styles.deltaAlert ?? false;
  return styles.deltaNone ?? false;
}

function formatDelta(delta: number | null): string {
  if (delta === null) return "—";
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`;
}

// --- Trends ---------------------------------------------------------------------

function TrendsTab({ batches }: { batches: BatchSummary[] }) {
  const biomarkers = useBiomarkers();

  if (biomarkers.isPending) return <Skeleton height={280} />;
  if (biomarkers.isError || !biomarkers.data) {
    return (
      <Card padding="lg" className="fx ac gap12">
        <span className="muted">Couldn't load trends.</span>
        <Button variant="ghost" onClick={() => void biomarkers.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  // Every biomarker with at least two readings gets a card (§5.9).
  const rows = biomarkers.data.panels
    .flatMap((panel) => panel.rows)
    .filter((row) => row.series.length >= 2);

  if (rows.length === 0) {
    return (
      <Card padding="lg" className={styles.emptyNote}>
        <CardTitle>Trends appear after your second snapshot.</CardTitle>
        <p className="muted">Each biomarker with two or more readings gets a chart here.</p>
      </Card>
    );
  }

  const first = batches[0];
  const last = batches[batches.length - 1];

  return (
    <div className={styles.trendGrid}>
      {rows.map((row) => (
        <div key={row.biomarkerKey} className={styles.trendcard}>
          <div className="fx ac jb">
            <div>
              <CardTitle className="disp">{row.displayName}</CardTitle>
              <div className={`muted ${styles.trendSub}`}>
                {row.value} {row.unit} ·{" "}
                <span className={trendWordClass(row)}>{trendWord(row)}</span>
              </div>
            </div>
            <Pill tone={row.status === "none" ? "ink" : row.status}>{row.flagLabel}</Pill>
          </div>
          <Sparkline
            className={styles.trendSpark}
            values={row.series}
            tone={row.status === "none" ? "blue" : row.status}
            viewBoxWidth={300}
            viewBoxHeight={90}
            strokeWidth={2.6}
            endDot
            height={90}
          />
          <div className={`fx jb mono faint ${styles.trendAxis}`}>
            <span>{first ? formatMonthYear(first.collectedAt) : ""}</span>
            <span>{last ? formatMonthYear(last.collectedAt) : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** "rising" / "improving" / "falling" / "stable" — direction read through status. */
function trendWord(row: BiomarkerRow): string {
  const direction = row.trend?.direction ?? "flat";
  if (direction === "flat") return "stable";
  if (direction === "up") return "rising";
  return row.status === "good" ? "improving" : "falling";
}

function trendWordClass(row: BiomarkerRow): string | undefined {
  if (row.status === "good") return styles.trendWordGood;
  if (row.status === "watch") return styles.trendWordWatch;
  if (row.status === "alert") return styles.trendWordAlert;
  return undefined;
}
