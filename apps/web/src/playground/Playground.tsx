import { useState } from "react";
import {
  Avatar,
  Button,
  Card,
  CardTitle,
  Field,
  Icon,
  ICON_NAMES,
  Input,
  Kicker,
  Link,
  Pill,
  RefBand,
  Ring,
  Segmented,
  Sparkline,
  StatusDot,
  Table,
  Tabs,
  Toggle,
} from "../ui";
import styles from "./Playground.module.css";

const PILL_TONES = ["good", "watch", "alert", "ai", "blue", "ink"] as const;
const STATUS_TONES = ["good", "watch", "alert", "none"] as const;

/**
 * Renders every design-system piece side by side for visual comparison
 * against the prototype (Fase 1 acceptance). Not linked from the app shell —
 * reachable only at /playground.
 */
export function Playground() {
  const [tab, setTab] = useState("snapshots");
  const [segment, setSegment] = useState("comfortable");
  const [aiConsent, setAiConsent] = useState(true);
  const [borderline, setBorderline] = useState(false);

  return (
    <main className={styles.page}>
      <Kicker>Design system</Kicker>
      <h1 className={styles.title}>Playground</h1>
      <p className={styles.subtitle}>
        Every primitive and SVG component rendered with the prototype's reference values. Compare
        side by side with <span className="mono">docs/03-design/BIOX App.html</span>.
      </p>

      <section className={styles.section}>
        <Kicker className={styles.sectionTitle}>Typography</Kicker>
        <div className={styles.row}>
          <span className="disp">Space Grotesk display</span>
          <span>IBM Plex Sans body</span>
          <span className="mono">IBM Plex Mono 14.6 g/dL</span>
          <span className="muted">muted</span>
          <span className="faint">faint</span>
          <Kicker>Kicker label</Kicker>
        </div>
      </section>

      <section className={styles.section}>
        <Kicker className={styles.sectionTitle}>Buttons</Kicker>
        <div className={styles.row}>
          <Button>Upload report</Button>
          <Button variant="ghost">Compare</Button>
          <Button size="lg">Confirm &amp; create snapshot</Button>
          <Button variant="ghost" size="lg">
            Cancel &amp; discard
          </Button>
          <Button>
            <Icon name="upload" size={15} />
            Upload report
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <Kicker className={styles.sectionTitle}>Pills</Kicker>
        <div className={styles.row}>
          {PILL_TONES.map((tone) => (
            <Pill key={tone} tone={tone}>
              {tone}
            </Pill>
          ))}
          <Pill tone="ai">
            <Icon name="sparkle" size={11} />
            AI insight
          </Pill>
          <Pill tone="good">
            <StatusDot tone="good" />
            In range
          </Pill>
        </div>
      </section>

      <section className={styles.section}>
        <Kicker className={styles.sectionTitle}>Status dots</Kicker>
        <div className={styles.row}>
          {STATUS_TONES.map((tone) => (
            <span key={tone} className={styles.row}>
              <StatusDot tone={tone} />
              <span className={styles.spec}>{tone}</span>
            </span>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <Kicker className={styles.sectionTitle}>Card + Table</Kicker>
        <Card padding="none" className={styles.clip}>
          <Table>
            <thead>
              <tr>
                <th>Biomarker</th>
                <th>Value</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Cholesterol</td>
                <td className="mono">214 mg/dL</td>
                <td className="faint mono">&lt; 200</td>
                <td>
                  <Pill tone="alert">Above target</Pill>
                </td>
              </tr>
              <tr>
                <td>HbA1c</td>
                <td className="mono">5.6 %</td>
                <td className="faint mono">&lt; 5.7</td>
                <td>
                  <Pill tone="watch">Borderline</Pill>
                </td>
              </tr>
              <tr>
                <td>CRP</td>
                <td className="mono">0.9 mg/L</td>
                <td className="faint mono">&lt; 3.0</td>
                <td>
                  <Pill tone="good">In range</Pill>
                </td>
              </tr>
            </tbody>
          </Table>
        </Card>
      </section>

      <section className={styles.section}>
        <Kicker className={styles.sectionTitle}>Tabs · Segmented · Toggle</Kicker>
        <div className={styles.row}>
          <Tabs
            aria-label="Timeline view"
            tabs={[
              { value: "snapshots", label: "Snapshots" },
              { value: "compare", label: "Compare" },
              { value: "trends", label: "Trends" },
            ]}
            value={tab}
            onChange={setTab}
          />
          <Segmented
            aria-label="Density"
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
            value={segment}
            onChange={setSegment}
          />
          <Toggle checked={aiConsent} onChange={setAiConsent} aria-label="AI processing" />
          <Toggle checked={borderline} onChange={setBorderline} aria-label="Flag borderline" />
        </div>
      </section>

      <section className={styles.section}>
        <Kicker className={styles.sectionTitle}>Form</Kicker>
        <Card padding="lg" className={styles.formDemo}>
          <Field label="Full name" htmlFor="pg-name">
            <Input id="pg-name" defaultValue="Marina Alves" />
          </Field>
          <Field label="Email" htmlFor="pg-email">
            <Input id="pg-email" type="email" placeholder="you@example.com" />
          </Field>
          <Field label="Date of birth (small)" htmlFor="pg-dob">
            <Input id="pg-dob" small defaultValue="12 May 1991" />
          </Field>
        </Card>
      </section>

      <section className={styles.section}>
        <Kicker className={styles.sectionTitle}>Links · Avatar</Kicker>
        <div className={styles.row}>
          <Link to="/playground">Router link</Link>
          <Link href="https://example.com">Anchor link</Link>
          <Link>
            View all
            <Icon name="chevronRight" size={13} />
          </Link>
          <Avatar name="Marina Alves" />
          <Avatar name="Pamylla" />
        </div>
      </section>

      <section className={styles.section}>
        <Kicker className={styles.sectionTitle}>Rings</Kicker>
        <div className={styles.row}>
          <Ring value={84} size={150} tone="good">
            <div className={`${styles.ringNumLg} disp`}>84</div>
            <div className={styles.ringOf}>/ 100</div>
          </Ring>
          <Ring value={84} size={140} tone="good">
            <div className={`${styles.ringNumLg} disp`}>84</div>
            <div className={styles.ringOf}>/ 100</div>
          </Ring>
          {(
            [
              [79, "watch"],
              [72, "watch"],
              [94, "good"],
              [90, "good"],
              [91, "good"],
              [96, "good"],
            ] as const
          ).map(([value, tone]) => (
            <Ring key={value} value={value} size={60} tone={tone}>
              <span className={`${styles.ringNumSm} disp`}>{value}</span>
            </Ring>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <Kicker className={styles.sectionTitle}>Sparklines</Kicker>
        <div className={styles.row}>
          <Sparkline values={[186, 190, 197, 205, 214]} tone="alert" width={80} height={24} />
          <Sparkline values={[5.4, 5.4, 5.5, 5.5, 5.6]} tone="watch" width={80} height={24} />
          <Sparkline values={[2.8, 2.4, 1.8, 1.3, 0.9]} tone="good" width={80} height={24} />
          <span className={styles.spec}>row 60×20</span>
        </div>
        <div className={styles.row}>
          <Card padding="md" className={styles.sparkTrend}>
            <CardTitle>Total Cholesterol</CardTitle>
            <Sparkline
              values={[186, 190, 197, 205, 214]}
              tone="alert"
              viewBoxWidth={300}
              viewBoxHeight={90}
              strokeWidth={2.6}
              endDot
              height={90}
            />
          </Card>
          <span className={styles.spec}>trend 300×90 + endDot</span>
        </div>
      </section>

      <section className={styles.section}>
        <Kicker className={styles.sectionTitle}>Reference band</Kicker>
        <div className={styles.row}>
          <RefBand className={styles.bandDemo} position={42} tone="good" />
          <span className={styles.spec}>good · 42%</span>
        </div>
        <div className={styles.row}>
          <RefBand className={styles.bandDemo} position={88} tone="watch" />
          <span className={styles.spec}>watch · 88%</span>
        </div>
        <div className={styles.row}>
          <RefBand
            className={styles.bandDemo}
            position={97}
            tone="alert"
            height={10}
            dotSize={13}
            labels
          />
          <span className={styles.spec}>alert · 97% · 10px + labels (detail hero)</span>
        </div>
        <div className={styles.row}>
          <RefBand className={styles.bandDemo} position={50} tone="none" />
          <span className={styles.spec}>tone none → renders nothing (§5.3)</span>
        </div>
      </section>

      <section className={styles.section}>
        <Kicker className={styles.sectionTitle}>Icons ({ICON_NAMES.length})</Kicker>
        <div className={styles.iconGrid}>
          {ICON_NAMES.map((name) => (
            <div key={name} className={styles.iconTile}>
              <Icon name={name} size={18} />
              <span className={styles.spec}>{name}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
