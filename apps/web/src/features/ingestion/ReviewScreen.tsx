import { useNavigate, useParams } from "react-router-dom";
import type { ExtractionItem } from "@biox/shared/contracts";
import { useExtraction } from "../../api";
import { Button, Card, Icon, Kicker, Link, Pill, Skeleton, Table, cx } from "../../ui";
import styles from "./ReviewScreen.module.css";

/** Widths of the fake PDF-preview lines (prototype's wireframe thumbnail). */
const PDF_LINES: Array<{ width: number; kind?: "title" | "strong" | "gap" }> = [
  { width: 52, kind: "title" },
  { width: 34 },
  { width: 0, kind: "gap" },
  { width: 70 },
  { width: 64 },
  { width: 68 },
  { width: 60 },
  { width: 0, kind: "gap" },
  { width: 44, kind: "strong" },
  { width: 72 },
  { width: 66 },
  { width: 70 },
];

export function ReviewScreen() {
  const navigate = useNavigate();
  const { extractionId } = useParams<{ extractionId: string }>();
  const extraction = useExtraction(extractionId ?? "");

  if (extraction.isPending) {
    return (
      <section className="content">
        <div className="page-h">
          <div>
            <Skeleton width={200} height={12} />
            <div style={{ marginTop: 12 }}>
              <Skeleton width={360} height={32} />
            </div>
          </div>
        </div>
        <div className={styles.revWrap}>
          <Card padding="md">
            <Skeleton height={360} />
          </Card>
          <Card padding="md">
            <Skeleton height={420} />
          </Card>
        </div>
      </section>
    );
  }

  if (extraction.isError || !extraction.data) {
    return (
      <section className="content">
        <Card padding="lg" className="fx ac gap12">
          <span className="muted">Couldn't load this extraction.</span>
          <Button variant="ghost" onClick={() => void extraction.refetch()}>
            Try again
          </Button>
        </Card>
      </section>
    );
  }

  const review = extraction.data;

  return (
    <section className="content">
      <div className="page-h">
        <div>
          <Kicker>Data · Human review</Kicker>
          <h1 className="h1 disp">Review extracted values</h1>
          <div className="h1s">
            Confirm the numbers BIOX read from your PDF. Anything low-confidence is flagged — edit
            it before you create the snapshot.
          </div>
        </div>
        <div className="fx ac gap10">
          <Pill tone="ink" className={styles.filePill}>
            <span className={styles.filePillIcon}>
              <Icon name="fileBlank" size={11} />
            </span>
            {review.reportFilename}
          </Pill>
        </div>
      </div>

      <div className={styles.revWrap}>
        <div className={styles.pdfprev}>
          <Kicker className={styles.pdfKick}>Source document</Kicker>
          <div className={styles.pdfpage}>
            {PDF_LINES.map((line, index) =>
              line.kind === "gap" ? (
                <div key={index} className={styles.pdfGap} />
              ) : (
                <div
                  key={index}
                  className={cx(
                    styles.pdfln,
                    line.kind === "title" && styles.pdflnTitle,
                    line.kind === "strong" && styles.pdflnStrong,
                  )}
                  style={{ width: `${line.width}%` }}
                />
              ),
            )}
          </div>
          <div className={`fx ac jb ${styles.pdfFoot}`}>
            <span className={`mono muted ${styles.pdfPageNum}`}>Page 1 of 2</span>
            {/* TODO(phase 4): real PDF link once reports live in storage. */}
            <Link title="The original PDF opens here once the real pipeline lands">Open PDF</Link>
          </div>
        </div>

        <Card padding="none" className="clip">
          <div className={`fx ac jb ${styles.tableHead}`}>
            <div>
              <b className={`disp ${styles.foundCount}`}>{review.counts.values} values found</b>{" "}
              <span className={`muted ${styles.foundAcross}`}>
                across {review.counts.panels} panels
              </span>
            </div>
            <Pill tone="watch">{review.counts.toCheck} to check</Pill>
          </div>
          <Table>
            <thead>
              <tr>
                <th>Biomarker</th>
                <th>Extracted value</th>
                <th>Confidence</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {review.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className={styles.bmName}>{item.displayName ?? item.rawLabel}</span>
                    {item.displayName && item.displayName !== item.rawLabel && (
                      <div className={styles.rawLabel}>{item.rawLabel}</div>
                    )}
                  </td>
                  <td>
                    <span className={styles.editcell}>
                      {itemValueDisplay(item)}{" "}
                      {item.unit && (
                        <span className={`muted mono ${styles.editUnit}`}>{item.unit}</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className={cx(styles.conf, styles[item.confidence])}>
                      <span className={styles.confdot} />
                      {item.confidence}
                    </span>
                  </td>
                  <td className={styles.editCol}>
                    {/* TODO(phase 4): inline editing persists via PATCH item. */}
                    <Link title="Editing lands with the real pipeline (Phase 4)">
                      <Icon name="pencil" size={14} />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>

      <div className={styles.revbar}>
        <Button variant="ghost" onClick={() => navigate("/upload")}>
          Cancel &amp; discard
        </Button>
        {/* TODO(phase 4): confirm runs the real transaction and creates the batch. */}
        <Button onClick={() => navigate("/")}>
          <Icon name="check" size={15} />
          Confirm &amp; create snapshot
        </Button>
      </div>
    </section>
  );
}

/** Qualifier renders as a mono prefix of the value (§5.4): "< 0.5". */
function itemValueDisplay(item: ExtractionItem): string {
  if (item.valueLabel) return item.valueLabel;
  if (item.value === null) return "—";
  return `${item.valueQualifier ? `${item.valueQualifier} ` : ""}${item.value}`;
}
