import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Field, Icon, Input, Kicker, Link } from "../../ui";
import styles from "./LoginScreen.module.css";

export function LoginScreen() {
  const navigate = useNavigate();

  // TODO(phase 3): real Firebase auth (email/password + Google) — the mock
  // stage signs straight into the demo data.
  const signIn = (event?: FormEvent) => {
    event?.preventDefault();
    navigate("/");
  };

  return (
    <div className={styles.login}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Icon name="logo" size={22} />
          </div>
          <div>
            <div className={styles.bname}>BIOX</div>
            <div className={styles.bkick}>Health Intelligence</div>
          </div>
        </div>

        <h1 className={`disp ${styles.tag}`}>Your lab results, as an evolving health timeline.</h1>

        <div className={styles.feats}>
          <div className={styles.lf}>
            <span className={styles.lfIc}>
              <Icon name="chart" size={17} />
            </span>
            <div>
              <div className={styles.lfT}>Track every biomarker over time</div>
              <div className={styles.lfS}>See trends and relationships, not isolated numbers.</div>
            </div>
          </div>
          <div className={styles.lf}>
            <span className={styles.lfIc}>
              <Icon name="gauge" size={17} />
            </span>
            <div>
              <div className={styles.lfT}>Deterministic scores</div>
              <div className={styles.lfS}>Medical scores computed in code — never by AI.</div>
            </div>
          </div>
          <div className={styles.lf}>
            <span className={styles.lfIc}>
              <Icon name="sparkle" size={15} />
            </span>
            <div>
              <div className={styles.lfT}>AI-assisted explanations</div>
              <div className={styles.lfS}>Grounded in your data and curated knowledge.</div>
            </div>
          </div>
        </div>

        <p className={styles.disclaimer}>
          BIOX is an educational project. It does not provide medical advice, diagnosis, or
          treatment. Every interpretation is for educational purposes only.
        </p>
      </div>

      <div className={styles.right}>
        <form className={styles.card} onSubmit={signIn}>
          <Kicker className={styles.welcome}>Welcome back</Kicker>
          <h2 className={`disp ${styles.title}`}>Sign in to BIOX</h2>

          <Field label="Email" htmlFor="login-email">
            <Input id="login-email" type="email" autoComplete="email" />
          </Field>
          <Field label="Password" htmlFor="login-password">
            <Input id="login-password" type="password" autoComplete="current-password" />
          </Field>

          <div className={`fx jb ac ${styles.optionsRow}`}>
            <label className={`fx ac gap8 ${styles.remember}`}>
              <input type="checkbox" defaultChecked />
              Remember me
            </label>
            <Link title="Password reset arrives with real auth (Phase 3)">Forgot password?</Link>
          </div>

          <Button type="submit" size="lg" className={styles.w100}>
            Sign in
          </Button>
          <div className={styles.ldiv}>or</div>
          <Button variant="ghost" size="lg" className={styles.w100} onClick={() => signIn()}>
            <Icon name="google" size={17} />
            Continue with Google
          </Button>

          <p className={`muted ${styles.signup}`}>
            New to BIOX?{" "}
            <Link title="Sign-up arrives with real auth (Phase 3)">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
