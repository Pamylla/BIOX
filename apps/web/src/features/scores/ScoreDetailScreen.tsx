import { useNavigate, useParams } from "react-router-dom";
import { systemKeySchema } from "@biox/shared/contracts";
import { useScoreDetail } from "../../api";
import { formatDate } from "../../lib/format";
import { formatScoreDelta, SCORE_STATUS_LABEL, scoreTone } from "../../lib/scores";
import { useBatchParam } from "../../lib/useBatchParam";
import {
  Button,
  Card,
  CardTitle,
  Icon,
  Kicker,
  Pill,
  Ring,
  Skeleton,
  Sparkline,
  StatusDot,
  Trend,
} from "../../ui";
import styles from "./ScoreDetailScreen.module.css";

export function ScoreDetailScreen() {
  const navigate = useNavigate();
  const { system } = useParams<{ system: string }>();
  const parsed = systemKeySchema.safeParse(system);

  if (!parsed.success) {
    return (
      <section className="content">
        <Card padding="lg">
          <CardTitle>Unknown score system.</CardTitle>
          <p className="muted">
            <Button variant="ghost" onClick={() => navigate("/scores")}>
              Back to scores
            </Button>
          </p>
        </Card>
      </section>
    );
  }

  return <ScoreDetailContent system={parsed.data} />;
}

function ScoreDetailContent({ system }: { system: ReturnType<typeof systemKeySchema.parse> }) {
  const navigate = useNavigate();
  const batchId = useBatchParam();
  const detail = useScoreDetail(system, batchId);

  if (detail.isPending) {
    return (
      <section className="content">
        <Skeleton width={120} height={14} />
        <div style={{ marginTop: 20 }}>
          <Skeleton height={400} />
        </div>
      </section>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <section className="content">
        <Card padding="lg" className="fx ac gap12">
          <span className="muted">Couldn't load this score.</span>
          <Button variant="ghost" onClick={() => void detail.refetch()}>
            Try again
          </Button>
        </Card>
      </section>
    );
  }

  const { card, inputs, history, relatedInsight, formulaVersion } = detail.data;

  return (
    <section className="content">
      <button type="button" className={styles.back} onClick={() => navigate("/scores")}>
        <Icon name="chevronLeft" size={14} />
        All scores
      </button>

      <div className={`page-h ${styles.pageH}`}>
        <div>
          <Kicker>System score · Deterministic</Kicker>
          <h1 className="h1 disp">{card.label}</h1>
        </div>
        <Pill tone={scoreTone(card.status)}>{SCORE_STATUS_LABEL[card.status]}</Pill>
      </div>

      <div className={styles.wrap}>
        <div className={styles.mainCol}>
          <Card padding="lg">
            <div className="fx ac gap24">
              <Ring value={card.value} size={120} tone={scoreTone(card.status)}>
                <div className={`ringnum disp ${styles.heroRingNum}`}>{card.value}</div>
                <div className="ringof">/ 100</div>
              </Ring>
              <div className="f1">
                {card.delta !== null && (
                  <Trend tone={scoreTone(card.status)}>
                    {formatScoreDelta(card.delta)} since last snapshot
                  </Trend>
                )}
                <p className={`muted ${styles.heroBlurb}`}>{card.blurb}</p>
              </div>
            </div>
          </Card>

          {inputs.length > 0 && (
            <Card padding="lg">
              <div className="fx ac jb">
                <CardTitle>How it's computed</CardTitle>
                <span className={styles.codetag}>
                  <Icon name="code" size={12} />
                  Code, not AI
                </span>
              </div>
              <p className={`muted ${styles.computeCopy}`}>
                This score is a pure function of the biomarkers below. It runs in the deterministic
                core — no language model is involved, so it's fully reproducible and auditable.
              </p>
              <Kicker className={styles.inputsKick}>Input biomarkers</Kicker>
              {inputs.map((input) => (
                <button
                  key={input.biomarkerKey}
                  type="button"
                  className={styles.computeRow}
                  onClick={() => navigate(`/biomarkers/${input.biomarkerKey}`)}
                >
                  <StatusDot tone={input.status} />
                  <div className="f1">
                    <div className={styles.computeNm}>{input.displayName}</div>
                  </div>
                  <span className={`mono muted ${styles.computeVal}`}>{input.valueDisplay}</span>
                  <Icon name="chevronRight" size={14} className="faint" />
                </button>
              ))}
              <span className={`mono faint ${styles.formulaVersion}`}>
                Formula version: {formulaVersion} — frozen when the snapshot was confirmed
              </span>
            </Card>
          )}

          <Card padding="lg">
            <CardTitle className={styles.historyHead}>Score over time</CardTitle>
            <Sparkline
              values={history.map((point) => point.value)}
              tone={scoreTone(card.status)}
              viewBoxWidth={300}
              viewBoxHeight={110}
              strokeWidth={2.6}
              endDot
              height={120}
            />
            <div className={`fx jb mono faint ${styles.historyAxis}`}>
              {history.map((point) => (
                <span key={point.batchId}>{formatDate(point.collectedAt)}</span>
              ))}
            </div>
          </Card>
        </div>

        <div className={styles.sideCol}>
          {relatedInsight && (
            <Card
              padding="md"
              className={styles.aiCard}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/insights/${relatedInsight.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  navigate(`/insights/${relatedInsight.id}`);
                }
              }}
            >
              <div className={`fx ac gap8 ${styles.aiHead}`}>
                <span className={styles.aiSpark}>
                  <Icon name="sparkle" size={12} />
                </span>
                <Kicker className={styles.aiKick}>AI explains this</Kicker>
              </div>
              <div className={styles.aiTitle}>{relatedInsight.title}</div>
            </Card>
          )}

          <Card padding="md" className={styles.whyCard}>
            <Kicker className={styles.whyKick}>Why deterministic?</Kicker>
            <p className={`muted ${styles.whyText}`}>
              Medical scores must be trustworthy and repeatable. BIOX computes them in code so the
              same inputs always produce the same result. AI only <i>explains</i> them — it never
              calculates a number.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
