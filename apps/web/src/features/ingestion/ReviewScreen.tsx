import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ExtractionItem } from "@biox/shared/contracts";
import { useDiscardExtraction, useExtraction, useUpdateExtractionItem } from "../../api";
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
  const { extractionId = "" } = useParams<{ extractionId: string }>();
  const extraction = useExtraction(extractionId);
  const updateItem = useUpdateExtractionItem(extractionId);
  const discard = useDiscardExtraction();
  const [editing, setEditing] = useState<{ id: string; draft: string } | null>(null);

  const saveEdit = (item: ExtractionItem) => {
    if (!editing) return;
    const draft = editing.draft.trim();
    const patch =
      item.valueLabel !== null
        ? { valueLabel: draft }
        : { value: draft === "" ? null : Number(draft) };
    if ("value" in patch && patch.value !== null && Number.isNaN(patch.value)) return;
    updateItem.mutate({ itemId: item.id, patch }, { onSuccess: () => setEditing(null) });
  };

  const discardAndLeave = () => {
    discard.mutate(extractionId, { onSuccess: () => navigate("/upload") });
  };

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

  const header = (
    <div className="page-h">
      <div>
        <Kicker>Data · Human review</Kicker>
        <h1 className="h1 disp">Review extracted values</h1>
        <div className="h1s">
          Confirm the numbers BIOX read from your PDF. Anything low-confidence is flagged — edit it
          before you create the snapshot.
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
  );

  // The worker is still extracting; useExtraction polls until this flips.
  if (review.status === "processing") {
    return (
      <section className="content">
        {header}
        <Card padding="lg" className={styles.stateCard}>
          <Icon name="gauge" size={26} />
          <b className="disp">BIOX is reading your report…</b>
          <span className="muted">
            This usually takes a few seconds. The extracted values will appear here for you to
            review.
          </span>
        </Card>
      </section>
    );
  }

  if (review.status === "failed") {
    return (
      <section className="content">
        {header}
        <Card padding="lg" className={styles.stateCard}>
          <Icon name="exclaim" size={26} />
          <b className="disp">We couldn't extract this report</b>
          <span className="muted">{review.error ?? "The extraction failed."}</span>
          <Button variant="ghost" onClick={() => navigate("/upload")}>
            Back to upload
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="content">
      {header}

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
              {review.items.map((item) => {
                const isEditing = editing?.id === item.id;
                return (
                  <tr key={item.id}>
                    <td>
                      <span className={styles.bmName}>{item.displayName ?? item.rawLabel}</span>
                      {item.displayName && item.displayName !== item.rawLabel && (
                        <div className={styles.rawLabel}>{item.rawLabel}</div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className={styles.editInput}
                          autoFocus
                          inputMode={item.valueLabel !== null ? "text" : "decimal"}
                          value={editing.draft}
                          onChange={(event) =>
                            setEditing({ id: item.id, draft: event.target.value })
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") saveEdit(item);
                            if (event.key === "Escape") setEditing(null);
                          }}
                        />
                      ) : (
                        <span className={styles.editcell}>
                          {itemValueDisplay(item)}{" "}
                          {item.unit && (
                            <span className={`muted mono ${styles.editUnit}`}>{item.unit}</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={cx(styles.conf, styles[item.confidence])}>
                        <span className={styles.confdot} />
                        {item.confidence}
                      </span>
                    </td>
                    <td className={styles.editCol}>
                      {isEditing ? (
                        <span className={styles.editActions}>
                          <Button
                            variant="ghost"
                            onClick={() => setEditing(null)}
                            disabled={updateItem.isPending}
                          >
                            Cancel
                          </Button>
                          <Button onClick={() => saveEdit(item)} disabled={updateItem.isPending}>
                            Save
                          </Button>
                        </span>
                      ) : item.editedByUser ? (
                        <button
                          type="button"
                          className={styles.edited}
                          onClick={() => startEdit(item, setEditing)}
                        >
                          <Icon name="check" size={13} />
                          Edited
                        </button>
                      ) : (
                        <Link onClick={() => startEdit(item, setEditing)}>
                          <Icon name="pencil" size={14} />
                          Edit
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      </div>

      <div className={styles.revbar}>
        <Button variant="ghost" onClick={discardAndLeave} disabled={discard.isPending}>
          {discard.isPending ? "Discarding…" : "Cancel & discard"}
        </Button>
        {/* TODO(phase 5): confirm runs the real transaction once the score engine lands. */}
        <Button disabled title="Confirm creates the snapshot once the score engine lands (Fase 5)">
          <Icon name="check" size={15} />
          Confirm &amp; create snapshot
        </Button>
      </div>
    </section>
  );
}

type EditState = { id: string; draft: string } | null;

/** Seeds the inline editor with the item's current numeric value or label. */
function startEdit(item: ExtractionItem, setEditing: (state: EditState) => void): void {
  const draft = item.valueLabel ?? (item.value !== null ? String(item.value) : "");
  setEditing({ id: item.id, draft });
}

/** Qualifier renders as a mono prefix of the value (§5.4): "< 0.5". */
function itemValueDisplay(item: ExtractionItem): string {
  if (item.valueLabel) return item.valueLabel;
  if (item.value === null) return "—";
  return `${item.valueQualifier ? `${item.valueQualifier} ` : ""}${item.value}`;
}
