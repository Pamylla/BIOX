import { useNavigate } from "react-router-dom";
import type { ActivityEvent, BiomarkerRow, ScoreStatus } from "@biox/shared/contracts";
import { useActivity, useBatches, useBiomarkers, useInsights, useMe, useScores } from "../../api";
import { formatDate, formatDateShort, formatMonth } from "../../lib/format";
import { useBatchParam } from "../../lib/useBatchParam";
import {
  Button,
  Card,
  CardTitle,
  Icon,
  Kicker,
  Link,
  Pill,
  Ring,
  Skeleton,
  StatusDot,
  Trend,
  trendArrow,
  type FlagTone,
  type IconName,
} from "../../ui";
import styles from "./DashboardScreen.module.css";

const SCORE_STATUS_LABEL: Record<ScoreStatus, string> = {
  excellent: "Excellent",
  good: "Good",
  watch: "Watch",
  alert: "Alert",
};

/** Score status → visual tone (excellent renders green like good). */
function scoreTone(status: ScoreStatus): FlagTone {
  return status === "excellent" ? "good" : status;
}

const INSIGHT_TONE_LABEL = { good: "Positive", watch: "Watch", alert: "Alert" } as const;

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const COUNT_WORDS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
];

export function DashboardScreen() {
  const navigate = useNavigate();
  const batchId = useBatchParam();

  const me = useMe();
  const batches = useBatches();
  const scores = useScores(batchId);
  const biomarkers = useBiomarkers(batchId);
  const insights = useInsights();
  const activity = useActivity(4);

  const queries = [me, batches, scores, biomarkers, insights, activity];
  if (queries.some((query) => query.isError)) {
    return (
      <section className="content">
        <Card padding="lg" className={styles.error}>
          <CardTitle>Something went wrong loading your dashboard.</CardTitle>
          <p className="muted">Your data is safe — this is just a loading hiccup.</p>
          <Button onClick={() => queries.forEach((query) => void query.refetch())}>
            Try again
          </Button>
        </Card>
      </section>
    );
  }

  if (queries.some((query) => query.isPending)) {
    return <DashboardSkeleton />;
  }

  // New account with no confirmed snapshot yet: the dashboard is an upload CTA.
  if (batches.data!.length === 0) {
    return (
      <section className="content">
        <Card padding="lg" className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Icon name="uploadTray" size={30} />
          </div>
          <div className={styles.emptyTitle}>Start your health timeline</div>
          <div className={styles.emptySub}>
            Upload your first lab report — BIOX extracts the values, you confirm them, and your
            first snapshot appears here.
          </div>
          <Button size="lg" onClick={() => navigate("/upload")}>
            Upload a report
          </Button>
        </Card>
      </section>
    );
  }

  const batchList = batches.data!;
  const currentBatch = batchId
    ? (batchList.find((batch) => batch.id === batchId) ?? batchList[batchList.length - 1]!)
    : batchList.find((batch) => batch.isLatest)!;
  const currentIndex = batchList.findIndex((batch) => batch.id === currentBatch.id);
  const previousBatch = currentIndex > 0 ? batchList[currentIndex - 1] : undefined;

  const overall = scores.data!.overall;
  const rows = biomarkers.data!.panels.flatMap((panel) => panel.rows);
  const attention = [
    ...rows.filter((row) => row.status === "alert"),
    ...rows.filter((row) => row.status === "watch"),
  ];
  const alertCount = rows.filter((row) => row.status === "alert").length;

  const firstName = me.data!.name.split(" ")[0] ?? me.data!.name;
  const attentionSentence =
    alertCount > 0 && previousBatch
      ? ` ${COUNT_WORDS[alertCount] ?? alertCount} marker${alertCount === 1 ? "" : "s"} moved out of target since ${formatMonth(previousBatch.collectedAt)}.`
      : "";

  return (
    <section className="content">
      <div className="page-h">
        <div>
          <Kicker>
            Health Snapshot · {formatDate(currentBatch.collectedAt)} · {currentBatch.performingLab}
          </Kicker>
          <h1 className="h1 disp">
            {greetingFor(new Date().getHours())}, {firstName}
          </h1>
          <div className="h1s">
            Here's where your health stands, based on your most recent labs.{attentionSentence}
          </div>
        </div>
      </div>

      <div className={styles.dashTop}>
        <Card padding="lg" className={styles.overall}>
          <div className="fx ac gap16">
            <Ring value={overall.value} size={150} tone={scoreTone(overall.status)}>
              <div className="ringnum disp">{overall.value}</div>
              <div className="ringof">/ 100</div>
            </Ring>
            <div>
              <Kicker>Overall Health</Kicker>
              <div className={`disp ${styles.overallStatus}`}>
                {SCORE_STATUS_LABEL[overall.status]}
              </div>
              {overall.delta !== null && previousBatch && (
                <Trend tone={overall.delta >= 0 ? "good" : "alert"}>
                  <Icon name="trendSmall" size={13} />
                  {overall.delta >= 0 ? "+" : ""}
                  {overall.delta} since {formatMonth(previousBatch.collectedAt)}
                </Trend>
              )}
              <p className={`muted ${styles.overallCopy}`}>
                Composite of your six system scores, computed in code.
              </p>
            </div>
          </div>
          <div className={styles.ostats}>
            <div className={styles.ostat}>
              <b className="disp">{currentBatch.markerCount}</b>
              <span>biomarkers tracked</span>
            </div>
            <div className={styles.ostat}>
              <b className={`disp ${styles.ostatAlert}`}>{alertCount}</b>
              <span>need attention</span>
            </div>
            <div className={styles.ostat}>
              <b className="disp">{batchList.length}</b>
              <span>snapshots</span>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className={`fx ac jb ${styles.cardHead}`}>
            <CardTitle>Needs attention</CardTitle>
            <Pill tone="alert">{alertCount} out of target</Pill>
          </div>
          {attention.map((row) => (
            <button
              key={row.biomarkerKey}
              type="button"
              className={styles.flag}
              onClick={() => navigate(`/biomarkers/${row.biomarkerKey}`)}
            >
              <StatusDot tone={row.status} />
              <div className="f1">
                <div className={styles.flagNm}>{row.displayName}</div>
                <div className={styles.flagSub}>{flagSubtitle(row)}</div>
              </div>
              {row.trend && (
                <Trend tone={row.trend.tone}>
                  {trendArrow(row.trend.direction)} {row.trend.deltaLabel}
                </Trend>
              )}
              <Icon name="chevronRight" size={16} className="faint" />
            </button>
          ))}
        </Card>
      </div>

      <div className="sec-h">
        <CardTitle>Your scores by system</CardTitle>
        <Link to="/scores">
          All scores
          <Icon name="chevronRight" size={13} />
        </Link>
      </div>
      <div className={styles.scoreGrid}>
        {scores.data!.systems.map((score) => (
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
          </button>
        ))}
      </div>

      <div className={styles.dashBot}>
        <Card padding="lg">
          <div className={`fx ac jb ${styles.insHead}`}>
            <CardTitle>Latest insights</CardTitle>
            <Pill tone="ai">
              <Icon name="sparkle" size={11} />
              AI · grounded
            </Pill>
          </div>
          {insights.data!.insights.slice(0, 2).map((insight) => (
            <button
              key={insight.id}
              type="button"
              className={styles.insRow}
              onClick={() => navigate(`/insights/${insight.id}`)}
            >
              <span className={styles.insSpark}>
                <Icon name="sparkle" size={15} />
              </span>
              <div className="f1">
                <div className={styles.insT}>{insight.title}</div>
                <div className={styles.insS}>{insight.summary}</div>
              </div>
              <Pill tone={insight.tone}>{INSIGHT_TONE_LABEL[insight.tone]}</Pill>
            </button>
          ))}
        </Card>

        <Card padding="lg">
          <CardTitle className={styles.actHead}>Recent activity</CardTitle>
          {activity.data!.map((event) => (
            <div key={event.id} className={styles.act}>
              <span className={`${styles.actIc} ${activityIconClass(event.type, styles)}`}>
                <Icon name={ACTIVITY_ICONS[event.type]} size={14} />
              </span>
              <div>
                <div className={styles.actT}>{event.title}</div>
                <div className={styles.actD}>
                  {formatDateShort(event.createdAt)}
                  {event.detail ? ` · ${event.detail}` : ""}
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </section>
  );
}

/** "214 mg/dL · target < 200" / "97 mg/dL · upper range, 70–99". */
function flagSubtitle(row: BiomarkerRow): string {
  const value = `${row.value ?? row.valueLabel ?? "—"}${row.value !== null ? ` ${row.unit}` : ""}`;
  if (!row.refRaw) return value;
  const ref = /^[<>]/.test(row.refRaw) ? `target ${row.refRaw}` : row.refRaw;
  const qualifier = row.status === "watch" ? `${row.flagLabel.toLowerCase()}, ` : "";
  return `${value} · ${qualifier}${ref}`;
}

const ACTIVITY_ICONS: Record<ActivityEvent["type"], IconName> = {
  "batch.created": "check",
  "insights.generated": "sparkle",
  "flag.crossed": "exclaim",
  "score.changed": "gauge",
};

function activityIconClass(type: ActivityEvent["type"], s: Record<string, string>): string {
  if (type === "batch.created") return s.actIcGood ?? "";
  if (type === "insights.generated") return s.actIcAi ?? "";
  if (type === "flag.crossed") return s.actIcAlert ?? "";
  return "";
}

/** Mirrors the loaded layout so the page doesn't jump when data arrives. */
function DashboardSkeleton() {
  return (
    <section className="content">
      <div className="page-h">
        <div>
          <Skeleton width={220} height={12} />
          <div style={{ marginTop: 12 }}>
            <Skeleton width={340} height={32} />
          </div>
        </div>
      </div>
      <div className={styles.dashTop}>
        <Card padding="lg">
          <Skeleton height={150} />
        </Card>
        <Card padding="lg">
          <Skeleton height={150} />
        </Card>
      </div>
      <div className="sec-h">
        <Skeleton width={180} height={18} />
      </div>
      <div className={styles.scoreGrid}>
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index}>
            <Skeleton height={60} />
          </Card>
        ))}
      </div>
    </section>
  );
}
