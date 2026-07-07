import { useNavigate } from "react-router-dom";
import type { ReportRow } from "@biox/shared/contracts";
import { useReports } from "../../api";
import { formatDate, formatFileSize, formatSequence } from "../../lib/format";
import { Button, Card, CardTitle, Icon, Kicker, Skeleton, Table, cx } from "../../ui";
import styles from "./UploadScreen.module.css";

const STATUS_META: Record<
  ReportRow["extractionStatus"],
  { label: string; className: keyof typeof styles; icon: "check" | "pencil" | "exclaim" | "gauge" }
> = {
  confirmed: { label: "Analyzed", className: "analyzed", icon: "check" },
  needs_review: { label: "Needs review", className: "needsReview", icon: "pencil" },
  processing: { label: "Processing", className: "processing", icon: "gauge" },
  failed: { label: "Failed", className: "failed", icon: "exclaim" },
  discarded: { label: "Discarded", className: "processing", icon: "exclaim" },
};

export function UploadScreen() {
  const navigate = useNavigate();
  const reports = useReports();

  // TODO(phase 4): real dropzone (file input + drag events + POST /v1/reports).
  // In the mock stage it opens the pending extraction, like the prototype does.
  const openPendingReview = () => {
    const pending = reports.data?.find((report) => report.extractionStatus === "needs_review");
    navigate(pending ? `/review/${pending.extractionId}` : "/upload");
  };

  return (
    <section className="content">
      <div className="page-h">
        <div>
          <Kicker>Data · Ingestion</Kicker>
          <h1 className="h1 disp">Upload a report</h1>
          <div className="h1s">
            Drop a lab PDF and BIOX will extract the values, ask you to confirm them, and create a
            new snapshot on your timeline.
          </div>
        </div>
      </div>

      <button type="button" className={styles.drop} onClick={openPendingReview}>
        <div className={styles.dropIc}>
          <Icon name="uploadTray" size={30} />
        </div>
        <div className={styles.dropT}>Drop your lab report here, or click to browse</div>
        <div className={styles.dropS}>PDF up to 20 MB · your file is parsed, never shared</div>
        <Button size="lg" className={styles.dropBtn} tabIndex={-1}>
          Choose file
        </Button>
      </button>

      <div className="sec-h">
        <CardTitle>Recent uploads</CardTitle>
      </div>
      {reports.isPending && (
        <Card padding="md">
          <Skeleton height={44} />
        </Card>
      )}
      {reports.isError && (
        <Card padding="md" className="fx ac gap12">
          <span className="muted">Couldn't load your uploads.</span>
          <Button variant="ghost" onClick={() => void reports.refetch()}>
            Try again
          </Button>
        </Card>
      )}
      {reports.data && (
        <Card padding="none" className="clip">
          <Table>
            <thead>
              <tr>
                <th>File</th>
                <th>Uploaded</th>
                <th>Size</th>
                <th>Snapshot</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.data.map((report) => {
                const meta = STATUS_META[report.extractionStatus];
                const reviewable = report.extractionStatus === "needs_review";
                return (
                  <tr
                    key={report.id}
                    className={cx(reviewable && styles.rowLink)}
                    onClick={
                      reviewable ? () => navigate(`/review/${report.extractionId}`) : undefined
                    }
                  >
                    <td>
                      <div className="fx ac gap12">
                        <span className={styles.filei}>
                          <Icon name="file" size={16} />
                        </span>
                        <span className={styles.fileName}>{report.filename}</span>
                      </div>
                    </td>
                    <td className="muted">{formatDate(report.uploadedAt)}</td>
                    <td className={`muted mono ${styles.sizeCell}`}>
                      {formatFileSize(report.sizeBytes)}
                    </td>
                    <td className="muted">
                      {report.batchSequence !== null
                        ? `Snapshot ${formatSequence(report.batchSequence)}`
                        : "—"}
                    </td>
                    <td>
                      <span className={cx(styles.upstat, styles[meta.className])}>
                        <Icon name={meta.icon} size={12} />
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}
    </section>
  );
}
