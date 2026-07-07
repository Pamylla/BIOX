import { useNavigate } from "react-router-dom";
import type { BiomarkerRow } from "@biox/shared/contracts";
import { useBiomarkers } from "../../api";
import { useBatchParam } from "../../lib/useBatchParam";
import {
  Button,
  Card,
  Icon,
  Kicker,
  Pill,
  Skeleton,
  Sparkline,
  StatusDot,
  Trend,
  trendArrow,
} from "../../ui";
import styles from "./BiomarkersScreen.module.css";

export function BiomarkersScreen() {
  const navigate = useNavigate();
  const batchId = useBatchParam();
  const biomarkers = useBiomarkers(batchId);

  if (biomarkers.isPending) {
    return (
      <section className="content">
        <div className="page-h">
          <div>
            <Skeleton width={180} height={12} />
            <div style={{ marginTop: 12 }}>
              <Skeleton width={300} height={32} />
            </div>
          </div>
        </div>
        <Skeleton height={300} />
      </section>
    );
  }

  if (biomarkers.isError || !biomarkers.data) {
    return (
      <section className="content">
        <Card padding="lg" className="fx ac gap12">
          <span className="muted">Couldn't load your biomarkers.</span>
          <Button variant="ghost" onClick={() => void biomarkers.refetch()}>
            Try again
          </Button>
        </Card>
      </section>
    );
  }

  const rows = biomarkers.data.panels.flatMap((panel) => panel.rows);
  const inRange = rows.filter((row) => row.status === "good").length;
  const borderline = rows.filter((row) => row.status === "watch").length;
  const above = rows.filter((row) => row.status === "alert").length;

  return (
    <section className="content">
      <div className="page-h">
        <div>
          <Kicker>Analysis · Series</Kicker>
          <h1 className="h1 disp">Biomarkers</h1>
          <div className="h1s">
            Every value measured across your snapshots, grouped by panel. Tap any marker to see its
            history, reference range and related insights.
          </div>
        </div>
        <div className="fx gap8">
          <Pill tone="good">{inRange} in range</Pill>
          {borderline > 0 && <Pill tone="watch">{borderline} borderline</Pill>}
          {above > 0 && <Pill tone="alert">{above} above</Pill>}
        </div>
      </div>

      {biomarkers.data.panels.map((panel) => (
        <div key={panel.key} className={styles.panel}>
          <div className={styles.panelH}>
            <span className={`disp ${styles.panelNm}`}>{panel.label}</span>
            <span className={`mono faint ${styles.panelCount}`}>{panel.rows.length}</span>
          </div>
          <Card padding="none" className="clip">
            {panel.rows.map((row) => (
              <button
                key={row.biomarkerKey}
                type="button"
                className={styles.row}
                onClick={() => navigate(`/biomarkers/${row.biomarkerKey}`)}
              >
                <div className="fx ac gap10">
                  <StatusDot tone={row.status} />
                  <div>
                    <div className={styles.nm}>{row.displayName}</div>
                    <div className={`faint ${styles.flagSub}`}>{row.flagLabel}</div>
                  </div>
                </div>
                <div>
                  <span className={styles.val}>{rowValueDisplay(row)}</span>{" "}
                  <span className={`faint mono ${styles.unit}`}>{row.unit}</span>
                </div>
                <Sparkline
                  values={row.series}
                  tone={row.status === "none" ? "blue" : row.status}
                  width={80}
                  height={24}
                />
                <div className={`faint mono ${styles.ref}`}>
                  {row.refRaw ? `ref ${row.refRaw}` : "no reference"}
                </div>
                {row.trend ? (
                  <Trend tone={row.trend.tone}>
                    {trendArrow(row.trend.direction)} {row.trend.deltaLabel}
                  </Trend>
                ) : (
                  <span />
                )}
                <Icon name="chevronRight" size={15} className="faint" />
              </button>
            ))}
          </Card>
        </div>
      ))}
    </section>
  );
}

/** Label results render the label; censored values keep the qualifier (§5.4). */
function rowValueDisplay(row: BiomarkerRow): string {
  if (row.valueLabel) return row.valueLabel;
  if (row.value === null) return "—";
  return `${row.valueQualifier ? `${row.valueQualifier} ` : ""}${row.value}`;
}
