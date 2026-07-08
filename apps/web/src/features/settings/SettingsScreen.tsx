import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { UserProfile } from "@biox/shared/contracts";
import { useMe } from "../../api";
import { useAuth } from "../auth/AuthProvider";
import { formatDate } from "../../lib/format";
import {
  Avatar,
  Button,
  Card,
  Icon,
  Input,
  Kicker,
  Pill,
  Segmented,
  Skeleton,
  Toggle,
  cx,
} from "../../ui";
import styles from "./SettingsScreen.module.css";

const TABS = [
  { value: "profile", label: "Profile" },
  { value: "units", label: "Units & ranges" },
  { value: "privacy", label: "Data & privacy" },
] as const;

type SettingsTab = (typeof TABS)[number]["value"];

export function SettingsScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const me = useMe();

  const rawTab = searchParams.get("tab");
  const tab: SettingsTab = rawTab === "units" || rawTab === "privacy" ? rawTab : "profile";

  return (
    <section className="content">
      <div className="page-h">
        <div>
          <Kicker>Account</Kicker>
          <h1 className="h1 disp">Settings</h1>
        </div>
      </div>

      <div className={styles.wrap}>
        <div>
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={cx(styles.navitem, tab === item.value && styles.on)}
              onClick={() =>
                setSearchParams((previous) => {
                  const next = new URLSearchParams(previous);
                  next.set("tab", item.value);
                  return next;
                })
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        <Card padding="lg">
          {me.isPending && <Skeleton height={280} />}
          {me.data && tab === "profile" && <ProfileTab user={me.data} />}
          {me.data && tab === "units" && <UnitsTab user={me.data} />}
          {me.data && tab === "privacy" && <PrivacyTab user={me.data} />}
        </Card>
      </div>
    </section>
  );
}

// TODO(phase 7): every control persists via PATCH /v1/me; local state until then.

function ProfileTab({ user }: { user: UserProfile }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [sex, setSex] = useState(user.sexAtBirth ?? "female");

  return (
    <>
      <div className={`fx ac gap16 ${styles.profileHead}`}>
        <Avatar name={name} className={styles.profileAvatar} />
        <div>
          <div className={`disp ${styles.profileName}`}>{name}</div>
          <div className={`muted ${styles.profileMail}`}>{email}</div>
        </div>
        <div className="f1" />
        {/* Avatar upload is post-MVP (§7); initials only. */}
        <Button variant="ghost" disabled title="Photo upload is post-MVP — initials for now">
          Change photo
        </Button>
      </div>

      <div className={styles.frow}>
        <div>
          <div className={styles.frowT}>Full name</div>
        </div>
        <Input small value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className={styles.frow}>
        <div>
          <div className={styles.frowT}>Email</div>
          <div className={styles.frowD}>Used for sign-in and notifications.</div>
        </div>
        <Input small value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <div className={styles.frow}>
        <div>
          <div className={styles.frowT}>Date of birth</div>
          {/* Copy fixed per §5.5 — DOB/sex feed AI context, never flag thresholds (ADR-002). */}
          <div className={styles.frowD}>
            Used as context for AI insights and future protocols — never to set your reference
            ranges, which always come from your own reports.
          </div>
        </div>
        <Input small readOnly value={user.dateOfBirth ? formatDate(user.dateOfBirth) : ""} />
      </div>
      <div className={styles.frow}>
        <div>
          <div className={styles.frowT}>Sex at birth</div>
          <div className={styles.frowD}>Used as context for AI insights and future protocols.</div>
        </div>
        <Segmented
          aria-label="Sex at birth"
          options={[
            { value: "female", label: "Female" },
            { value: "male", label: "Male" },
          ]}
          value={sex}
          onChange={setSex}
        />
      </div>
    </>
  );
}

function UnitsTab({ user }: { user: UserProfile }) {
  const [flagBorderline, setFlagBorderline] = useState(user.flagBorderline);

  return (
    <>
      <div className={styles.frow}>
        <div>
          <div className={styles.frowT}>Measurement system</div>
          {/* Unit conversion is post-MVP (§7): values display exactly as reported. */}
          <div className={styles.frowD}>
            Values are shown exactly as printed on your lab report. Unit conversion is coming
            post-MVP.
          </div>
        </div>
        <Pill tone="ink">As reported</Pill>
      </div>
      {/* "Custom reference ranges" was cut (§5.1): ranges come from the report
          itself (ADR-002); post-MVP this becomes "Personal targets". */}
      <div className={styles.frow}>
        <div>
          <div className={styles.frowT}>Flag borderline values</div>
          <div className={styles.frowD}>
            Show an amber "watch" state for values within 5% of a threshold. Applies to future
            snapshots — confirmed ones stay frozen.
          </div>
        </div>
        <Toggle
          checked={flagBorderline}
          onChange={setFlagBorderline}
          aria-label="Flag borderline values"
        />
      </div>
      <div className={styles.frow}>
        <div>
          <div className={styles.frowT}>Date format</div>
          <div className={styles.frowD}>Fixed as DD MMM YYYY in the MVP.</div>
        </div>
        <Pill tone="ink">DD MMM YYYY</Pill>
      </div>
    </>
  );
}

function PrivacyTab({ user }: { user: UserProfile }) {
  const { signOut } = useAuth();
  const [aiConsent, setAiConsent] = useState(user.aiProcessingConsent);

  // Refresh local consent if the profile refetches with a different value.
  useEffect(() => setAiConsent(user.aiProcessingConsent), [user.aiProcessingConsent]);

  return (
    <>
      <div className={styles.frow}>
        <div className={styles.googleRow}>
          <Icon name="google" size={20} />
          <div>
            <div className={styles.frowT}>Connected account</div>
            <div className={styles.frowD}>Signed in with Google via Firebase.</div>
          </div>
        </div>
        <Pill tone="good">Connected</Pill>
      </div>
      <div className={styles.frow}>
        <div>
          <div className={styles.frowT}>Export my data</div>
          <div className={styles.frowD}>
            Download all your reports, readings and snapshots as JSON.
          </div>
        </div>
        {/* TODO(phase 7): POST /v1/me/export produces the JSON bundle. */}
        <Button variant="ghost" disabled title="Export lands with the real API (Phase 7)">
          Export
        </Button>
      </div>
      <div className={styles.frow}>
        <div>
          <div className={styles.frowT}>AI processing</div>
          <div className={styles.frowD}>
            Allow BIOX to generate AI insights from your readings. Turning this off stops new
            insights immediately.
          </div>
        </div>
        <Toggle checked={aiConsent} onChange={setAiConsent} aria-label="AI processing consent" />
      </div>
      <div className={styles.frow}>
        <div>
          <div className={`${styles.frowT} ${styles.danger}`}>Delete account</div>
          <div className={styles.frowD}>
            Permanently remove your account and all health data. This cannot be undone.
          </div>
        </div>
        {/* TODO(phase 7): two-tier deletion (soft delete + LGPD purge window). */}
        <Button
          variant="ghost"
          className={styles.dangerBtn}
          disabled
          title="Two-tier deletion lands with the real API (Phase 7)"
        >
          Delete
        </Button>
      </div>
      <div className={styles.foot}>
        <span className={`muted ${styles.footNote}`}>Signed in as {user.name}</span>
        {/* Firebase sign-out flips the auth state; RequireAuth redirects to /login. */}
        <Button variant="ghost" onClick={() => void signOut()}>
          <Icon name="signOut" size={14} />
          Sign out
        </Button>
      </div>
    </>
  );
}
