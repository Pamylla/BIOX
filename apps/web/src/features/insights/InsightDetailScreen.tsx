import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInsight, useMarkInsightRead } from "../../api";
import { formatDate } from "../../lib/format";
import { INSIGHT_TONE_LABEL } from "../../lib/labels";
import { SCORE_STATUS_LABEL, scoreTone } from "../../lib/scores";
import { Button, Card, CardTitle, Icon, Kicker, Pill, Ring, Skeleton, StatusDot } from "../../ui";
import styles from "./InsightDetailScreen.module.css";

export function InsightDetailScreen() {
  const navigate = useNavigate();
  const { insightId } = useParams<{ insightId: string }>();
  const insight = useInsight(insightId ?? "");
  const markRead = useMarkInsightRead();

  // Opening an unread insight marks it read (§5.11) — the sidebar badge drops.
  const isUnread = insight.data?.readAt === null;
  const insightKey = insight.data?.id;
  useEffect(() => {
    if (insightKey && isUnread) markRead.mutate(insightKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per loaded insight
  }, [insightKey, isUnread]);

  if (insight.isPending) {
    return (
      <section className="content">
        <Skeleton width={120} height={14} />
        <div style={{ marginTop: 20 }}>
          <Skeleton height={360} />
        </div>
      </section>
    );
  }

  if (insight.isError || !insight.data) {
    return (
      <section className="content">
        <Card padding="lg" className="fx ac gap12">
          <span className="muted">Couldn't load this insight.</span>
          <Button variant="ghost" onClick={() => void insight.refetch()}>
            Try again
          </Button>
        </Card>
      </section>
    );
  }

  const detail = insight.data;

  return (
    <section className="content">
      <button type="button" className={styles.back} onClick={() => navigate("/insights")}>
        <Icon name="chevronLeft" size={14} />
        All insights
      </button>

      <div className={`page-h ${styles.pageH}`}>
        <div>
          <div className={`fx ac gap10 ${styles.pillRow}`}>
            <Pill tone="ai">
              <Icon name="sparkle" size={11} />
              AI insight
            </Pill>
            <Pill tone={detail.tone}>{INSIGHT_TONE_LABEL[detail.tone]}</Pill>
            <span className={`mono faint ${styles.date}`}>{formatDate(detail.createdAt)}</span>
          </div>
          <h1 className={`h1 disp ${styles.title}`}>{detail.title}</h1>
        </div>
      </div>

      <div className={styles.wrap}>
        <div className={styles.mainCol}>
          <Card padding="lg">
            <p className={styles.summary}>{detail.summary}</p>
            <p className={`muted ${styles.body}`}>{detail.body}</p>
          </Card>

          <Card padding="lg">
            <div className={`fx ac gap8 ${styles.groundHead}`}>
              <Icon name="file" size={16} className="muted" />
              <CardTitle>Grounded in</CardTitle>
            </div>
            <div className={styles.ground}>
              <span className={styles.groundIc}>
                <Icon name="trendBare" size={15} />
              </span>
              <div>
                <div className={styles.groundTitle}>Your readings</div>
                <div className={`muted ${styles.groundSub}`}>{detail.grounding.readings}</div>
              </div>
            </div>
            <div className={styles.ground}>
              <span className={styles.groundIc}>
                <Icon name="fileText" size={14} />
              </span>
              <div>
                <div className={styles.groundTitle}>Curated knowledge</div>
                <div className={`muted ${styles.groundSub}`}>{detail.grounding.knowledge}</div>
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.sideCol}>
          <Card padding="md">
            <Kicker className={styles.sideKick}>Related biomarkers</Kicker>
            {detail.relatedBiomarkers.map((related) => (
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

          {detail.relatedScore && (
            <Card
              padding="md"
              className={styles.scoreCard}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/scores/${detail.relatedScore!.systemKey}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  navigate(`/scores/${detail.relatedScore!.systemKey}`);
                }
              }}
            >
              <Kicker className={styles.sideKick}>Related score</Kicker>
              <div className="fx ac gap12">
                <Ring
                  value={detail.relatedScore.value}
                  size={44}
                  tone={scoreTone(detail.relatedScore.status)}
                >
                  <span className={`sringn disp ${styles.scoreRingNum}`}>
                    {detail.relatedScore.value}
                  </span>
                </Ring>
                <div className="f1">
                  <div className={styles.scoreNm}>{detail.relatedScore.label}</div>
                  <Pill tone={scoreTone(detail.relatedScore.status)} className={styles.scorePill}>
                    {SCORE_STATUS_LABEL[detail.relatedScore.status]}
                  </Pill>
                </div>
              </div>
            </Card>
          )}

          <Card padding="md" className={styles.disclaimer}>
            <p className={`muted ${styles.disclaimerText}`}>
              ⚠ Educational only. BIOX does not provide medical advice, diagnosis or treatment.
              Discuss results with a qualified professional.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
