import { useNavigate } from "react-router-dom";
import { useInsights } from "../../api";
import { formatDate } from "../../lib/format";
import { INSIGHT_TONE_LABEL } from "../../lib/labels";
import { Button, Card, Icon, Kicker, Pill, Skeleton } from "../../ui";
import styles from "./InsightsScreen.module.css";

export function InsightsScreen() {
  const navigate = useNavigate();
  const insights = useInsights();

  if (insights.isPending) {
    return (
      <section className="content">
        <div className="page-h">
          <div>
            <Skeleton width={180} height={12} />
            <div style={{ marginTop: 12 }}>
              <Skeleton width={260} height={32} />
            </div>
          </div>
        </div>
        <Skeleton height={280} />
      </section>
    );
  }

  if (insights.isError || !insights.data) {
    return (
      <section className="content">
        <Card padding="lg" className="fx ac gap12">
          <span className="muted">Couldn't load your insights.</span>
          <Button variant="ghost" onClick={() => void insights.refetch()}>
            Try again
          </Button>
        </Card>
      </section>
    );
  }

  const { insights: list, unreadCount } = insights.data;

  return (
    <section className="content">
      <div className="page-h">
        <div>
          <Kicker>Analysis · AI-assisted</Kicker>
          <h1 className="h1 disp">Insights</h1>
          <div className="h1s">
            Natural-language explanations of what's happening in your data. Every insight is
            grounded in your own readings and curated knowledge.
          </div>
        </div>
        {unreadCount > 0 && (
          <Pill tone="ai">
            <Icon name="sparkle" size={11} />
            {unreadCount} new
          </Pill>
        )}
      </div>

      <div className={styles.banner}>
        <span className={styles.bannerIcon}>
          <Icon name="sparkle" size={15} />
        </span>
        <div>
          <div className={styles.bannerTitle}>AI explains, it never diagnoses.</div>
          <div className={`muted ${styles.bannerSub}`}>
            Insights summarize and correlate your data for education only. They don't compute scores
            and are not medical advice.
          </div>
        </div>
      </div>

      {list.length === 0 && (
        <Card padding="lg">
          <p className="muted">
            No insights yet — they're generated after you confirm a snapshot, when AI processing is
            enabled in Settings.
          </p>
        </Card>
      )}

      {list.map((insight) => (
        <button
          key={insight.id}
          type="button"
          className={styles.card}
          onClick={() => navigate(`/insights/${insight.id}`)}
        >
          <span className={styles.sparkIcon}>
            <Icon name="sparkle" size={17} />
          </span>
          <div className="f1">
            <div className="fx ac jb gap12">
              <div className={styles.title}>{insight.title}</div>
              <Pill tone={insight.tone}>{INSIGHT_TONE_LABEL[insight.tone]}</Pill>
            </div>
            <div className={styles.summary}>{insight.summary}</div>
            <div className={`fx ac jb ${styles.footRow}`}>
              <div className={styles.chiprow}>
                {insight.markers.map((marker) => (
                  <span key={marker.biomarkerKey} className={styles.mchip}>
                    {marker.displayName}
                  </span>
                ))}
              </div>
              <span className={`mono faint ${styles.date}`}>{formatDate(insight.createdAt)}</span>
            </div>
          </div>
        </button>
      ))}
    </section>
  );
}
