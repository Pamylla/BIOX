import { useNavigate, useParams } from "react-router-dom";
import type { BiomarkerSeries } from "@biox/shared/contracts";
import { useBiomarkerSeries } from "../../api";
import { formatDate } from "../../lib/format";
import { SCORE_STATUS_LABEL, scoreTone } from "../../lib/scores";
import {
  Button,
  Card,
  CardTitle,
  Icon,
  Kicker,
  Pill,
  RefBand,
  Ring,
  Skeleton,
  Sparkline,
  StatusDot,
  Table,
  Trend,
  trendArrow,
} from "../../ui";
import styles from "./BiomarkerDetailScreen.module.css";

export function BiomarkerDetailScreen() {
  const navigate = useNavigate();
  const { biomarkerKey } = useParams<{ biomarkerKey: string }>();
  const series = useBiomarkerSeries(biomarkerKey ?? "");

  if (series.isPending) {
    return (
      <section className="content">
        <Skeleton width={140} height={14} />
        <div style={{ marginTop: 20 }}>
          <Skeleton height={420} />
        </div>
      </section>
    );
  }

  if (series.isError || !series.data) {
    return (
      <section className="content">
        <Card padding="lg" className="fx ac gap12">
          <span className="muted">Couldn't load this biomarker.</span>
          <Button variant="ghost" onClick={() => void series.refetch()}>
            Try again
          </Button>
        </Card>
      </section>
    );
  }

  const marker = series.data;
  const { current } = marker;
  const values = marker.readings
    .slice()
    .reverse()
    .map((reading) => reading.value)
    .filter((value): value is number => value !== null);

  return (
    <section className="content">
      <button type="button" className={styles.back} onClick={() => navigate("/biomarkers")}>
        <Icon name="chevronLeft" size={14} />
        All biomarkers
      </button>

      <div className={`page-h ${styles.pageH}`}>
        <div>
          <Kicker>{marker.panelLabel}</Kicker>
          <h1 className="h1 disp">{marker.displayName}</h1>
        </div>
        <Pill tone={current.status === "none" ? "ink" : current.status}>
          <StatusDot tone={current.status} />
          {current.flagLabel}
        </Pill>
      </div>

      <div className={styles.wrap}>
        <div className={styles.mainCol}>
          <Card padding="lg">
            <div className={`fx ac gap16 ${styles.heroRow}`}>
              <div className={`disp ${styles.bigval}`}>{currentValueDisplay(marker)}</div>
              <div className={styles.heroMeta}>
                <div className={`muted mono ${styles.heroUnit}`}>{marker.unit}</div>
                {current.trend && (
                  <Trend tone={current.trend.tone} className={styles.heroTrend}>
                    {trendArrow(current.trend.direction)} {current.trend.deltaLabel} since last
                    snapshot
                  </Trend>
                )}
              </div>
              <div className="f1" />
              <div className={styles.heroRef}>
                <Kicker>Reference</Kicker>
                <div className={`mono ${styles.heroRefVal}`}>{current.refRaw ?? "—"}</div>
              </div>
            </div>
            {current.status !== "none" && current.positionPct !== null ? (
              <RefBand
                className={styles.band}
                position={current.positionPct}
                tone={current.status}
                height={10}
                dotSize={13}
                labels
              />
            ) : (
              <p className={`muted ${styles.noRef}`}>
                This reading came without a reference range on the report, so BIOX shows no flag for
                it.
              </p>
            )}
          </Card>

          <Card padding="lg">
            <div className={`fx ac jb ${styles.historyHead}`}>
              <CardTitle>History</CardTitle>
              <span className={`mono faint ${styles.historyCount}`}>
                {marker.readings.length} snapshots
              </span>
            </div>
            <Sparkline
              values={values}
              tone={current.status === "none" ? "blue" : current.status}
              viewBoxWidth={300}
              viewBoxHeight={130}
              strokeWidth={2.6}
              height={150}
            />
            <div className={`fx jb mono faint ${styles.historyAxis}`}>
              {marker.readings
                .slice()
                .reverse()
                .map((reading) => (
                  <span key={reading.batchId}>{formatDate(reading.collectedAt)}</span>
                ))}
            </div>
          </Card>

          <Card padding="none" className="clip">
            <div className={styles.pastHead}>
              <CardTitle>Past readings</CardTitle>
            </div>
            <Table>
              <thead>
                <tr>
                  <th>Snapshot date</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {marker.readings.map((reading) => (
                  <tr key={reading.batchId}>
                    <td className="muted">{formatDate(reading.collectedAt)}</td>
                    <td className={`mono ${styles.pastVal}`}>
                      {reading.valueLabel ?? reading.value ?? "—"} {marker.unit}
                    </td>
                    <td>
                      <Pill tone={reading.status === "none" ? "ink" : reading.status}>
                        <StatusDot tone={reading.status} />
                        {reading.flagLabel}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>

        <div className={styles.sideCol}>
          <Card padding="md">
            <Kicker className={styles.sideKick}>Related biomarkers</Kicker>
            {marker.related.biomarkers.map((related) => (
              <button
                key={related.biomarkerKey}
                type="button"
                className={styles.relrow}
                onClick={() => navigate(`/biomarkers/${related.biomarkerKey}`)}
              >
                <StatusDot tone={related.status} />
                <div className="f1">
                  <div className={styles.relNm}>{related.displayName}</div>
                </div>
                <span className={`mono muted ${styles.relVal}`}>{related.valueDisplay}</span>
              </button>
            ))}
          </Card>

          {marker.related.score && (
            <Card
              padding="md"
              className={styles.scoreCard}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/scores/${marker.related.score!.systemKey}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  navigate(`/scores/${marker.related.score!.systemKey}`);
                }
              }}
            >
              <Kicker className={styles.sideKick}>Related score</Kicker>
              <div className="fx ac gap12">
                <Ring
                  value={marker.related.score.value}
                  size={48}
                  tone={scoreTone(marker.related.score.status)}
                >
                  <span className={`sringn disp ${styles.scoreRingNum}`}>
                    {marker.related.score.value}
                  </span>
                </Ring>
                <div className="f1">
                  <div className={styles.scoreNm}>{marker.related.score.label}</div>
                  <Pill tone={scoreTone(marker.related.score.status)} className={styles.scorePill}>
                    {SCORE_STATUS_LABEL[marker.related.score.status]}
                  </Pill>
                </div>
                <Icon name="chevronRight" size={15} className="faint" />
              </div>
            </Card>
          )}

          {marker.related.insight && (
            <Card
              padding="md"
              className={styles.aiCard}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/insights/${marker.related.insight!.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  navigate(`/insights/${marker.related.insight!.id}`);
                }
              }}
            >
              <div className={`fx ac gap8 ${styles.aiHead}`}>
                <span className={styles.aiSpark}>
                  <Icon name="sparkle" size={12} />
                </span>
                <Kicker className={styles.aiKick}>AI insight</Kicker>
              </div>
              <div className={styles.aiTitle}>{marker.related.insight.title}</div>
            </Card>
          )}

          <Card padding="md" className={styles.aboutCard}>
            <Kicker className={styles.sideKick}>About</Kicker>
            {/* Copy fixed per §5.2 — ranges come from the lab report (ADR-002),
                never from population defaults. */}
            <p className={`muted ${styles.aboutText}`}>
              Reference ranges shown here come from your own lab report for each reading. BIOX flags
              values relative to those thresholds — for education only, not a diagnosis.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}

/** Big hero value: label results and censored values render per §5.4. */
function currentValueDisplay(marker: BiomarkerSeries): string {
  const { current } = marker;
  if (current.valueLabel) return current.valueLabel;
  if (current.value === null) return "—";
  return `${current.valueQualifier ? `${current.valueQualifier} ` : ""}${current.value}`;
}
