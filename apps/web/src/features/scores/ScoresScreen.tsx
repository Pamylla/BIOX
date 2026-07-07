import { useNavigate } from "react-router-dom";
import { useBatches, useScores } from "../../api";
import { formatMonth } from "../../lib/format";
import { formatScoreDelta, SCORE_STATUS_LABEL, scoreTone } from "../../lib/scores";
import { useBatchParam } from "../../lib/useBatchParam";
import { Button, Card, CardTitle, Icon, Kicker, Pill, Ring, Skeleton, Trend } from "../../ui";
import styles from "./ScoresScreen.module.css";

export function ScoresScreen() {
  const navigate = useNavigate();
  const batchId = useBatchParam();
  const scores = useScores(batchId);
  const batches = useBatches();

  if (scores.isPending || batches.isPending) {
    return (
      <section className="content">
        <div className="page-h">
          <div>
            <Skeleton width={200} height={12} />
            <div style={{ marginTop: 12 }}>
              <Skeleton width={260} height={32} />
            </div>
          </div>
        </div>
        <Skeleton height={190} />
      </section>
    );
  }

  if (scores.isError || batches.isError || !scores.data || !batches.data) {
    return (
      <section className="content">
        <Card padding="lg" className="fx ac gap12">
          <span className="muted">Couldn't load your scores.</span>
          <Button variant="ghost" onClick={() => void scores.refetch()}>
            Try again
          </Button>
        </Card>
      </section>
    );
  }

  const { overall, systems } = scores.data;
  const currentIndex = batches.data.findIndex((batch) => batch.id === scores.data.batchId);
  const previousBatch = currentIndex > 0 ? batches.data[currentIndex - 1] : undefined;

  return (
    <section className="content">
      <div className="page-h">
        <div>
          <Kicker>Analysis · Deterministic</Kicker>
          <h1 className="h1 disp">Scores</h1>
          <div className="h1s">
            Medical scores computed from your biomarkers by code — reproducible and never generated
            by AI. The same readings always give the same score.
          </div>
        </div>
        <span className={styles.codetag}>
          <Icon name="code" size={13} />
          Computed in code
        </span>
      </div>

      <Card padding="lg" className={styles.hero}>
        <div className={styles.heroGrid}>
          <Ring value={overall.value} size={140} tone={scoreTone(overall.status)}>
            <div className="ringnum disp">{overall.value}</div>
            <div className="ringof">/ 100</div>
          </Ring>
          <div>
            <Kicker>Overall Health</Kicker>
            <div className={`fx ac gap12 ${styles.heroStatusRow}`}>
              <span className={`disp ${styles.heroStatus}`}>
                {SCORE_STATUS_LABEL[overall.status]}
              </span>
              {overall.delta !== null && previousBatch && (
                <Trend tone={overall.delta >= 0 ? "good" : "alert"}>
                  <Icon name="trendSmall" size={13} />
                  {formatScoreDelta(overall.delta)} since {formatMonth(previousBatch.collectedAt)}
                </Trend>
              )}
            </div>
            <p className={`muted ${styles.heroCopy}`}>{overall.blurb}</p>
          </div>
        </div>
      </Card>

      <div className="sec-h">
        <CardTitle>By system</CardTitle>
      </div>
      <div className={styles.scoreGrid}>
        {systems.map((score) => (
          <button
            key={score.systemKey}
            type="button"
            className={styles.scard}
            onClick={() => navigate(`/scores/${score.systemKey}`)}
          >
            <Ring value={score.value} size={60} tone={scoreTone(score.status)}>
              <span className="sringn disp">{score.value}</span>
            </Ring>
            <div className="f1">
              <div className={styles.scardNm}>{score.label}</div>
              <Pill tone={scoreTone(score.status)} className={styles.scardPill}>
                {SCORE_STATUS_LABEL[score.status]}
              </Pill>
            </div>
            <Icon name="chevronRight" size={15} className="faint" />
          </button>
        ))}
      </div>
    </section>
  );
}
