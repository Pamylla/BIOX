import { useRef, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { ReportRow } from "@biox/shared/contracts";
import { useReports, useUploadReport } from "../../api";
import { formatDate, formatFileSize, formatSequence } from "../../lib/format";
import { Button, Card, CardTitle, Icon, Kicker, Skeleton, Table, cx } from "../../ui";
import styles from "./UploadScreen.module.css";

const MAX_REPORT_BYTES = 20 * 1024 * 1024; // mirrors the API's limit (plan §12 Fase 4)

/** Client-side guard so obvious mistakes never reach the server; the API re-checks. */
function rejectReason(file: File): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Only PDF reports are accepted.";
  if (file.size > MAX_REPORT_BYTES) return "That file is over the 20 MB limit.";
  return null;
}

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
  const upload = useUploadReport();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  const submit = (file: File | undefined) => {
    setRejected(null);
    if (!file) return;
    const reason = rejectReason(file);
    if (reason) {
      setRejected(reason);
      return;
    }
    upload.mutate(file, {
      onSuccess: (result) => navigate(`/review/${result.extractionId}`),
    });
  };

  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    submit(event.dataTransfer.files[0]);
  };

  const uploadError = upload.isError
    ? upload.error instanceof Error
      ? upload.error.message
      : "Upload failed."
    : null;

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

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(event) => submit(event.target.files?.[0])}
      />
      <button
        type="button"
        className={cx(styles.drop, dragging && styles.dragging)}
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className={styles.dropIc}>
          <Icon name="uploadTray" size={30} />
        </div>
        <div className={styles.dropT}>
          {upload.isPending ? "Uploading…" : "Drop your lab report here, or click to browse"}
        </div>
        <div className={styles.dropS}>PDF up to 20 MB · your file is parsed, never shared</div>
        <Button size="lg" className={styles.dropBtn} tabIndex={-1}>
          Choose file
        </Button>
      </button>
      {(rejected ?? uploadError) && (
        <div className={styles.uploadError} role="alert">
          {rejected ?? uploadError}
        </div>
      )}

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
