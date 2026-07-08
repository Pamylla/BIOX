import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Button, Field, Icon, Input, Kicker, Link } from "../../ui";
import { describeSignInError } from "./auth-errors";
import { useAuth } from "./AuthProvider";
import styles from "./LoginScreen.module.css";

export function LoginScreen() {
  const { state, sessionError, signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state.status === "signedIn") return <Navigate to="/" replace />;

  const run = async (signIn: () => Promise<void>) => {
    setError(null);
    setPending(true);
    try {
      await signIn();
      // Redirect happens via state.status once /v1/auth/session resolves.
    } catch (caught) {
      setError(describeSignInError(caught));
    } finally {
      setPending(false);
    }
  };

  const submitEmail = (event: FormEvent) => {
    event.preventDefault();
    void run(() => signInWithEmail(email, password));
  };

  const message = error ?? sessionError;

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
        <form className={styles.card} onSubmit={submitEmail}>
          <Kicker className={styles.welcome}>Welcome back</Kicker>
          <h2 className={`disp ${styles.title}`}>Sign in to BIOX</h2>

          {message && (
            <p className={styles.error} role="alert">
              {message}
            </p>
          )}

          <Field label="Email" htmlFor="login-email">
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Password" htmlFor="login-password">
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          <div className={`fx jb ac ${styles.optionsRow}`}>
            <label className={`fx ac gap8 ${styles.remember}`}>
              <input type="checkbox" defaultChecked />
              Remember me
            </label>
            <Link title="Password reset is coming soon">Forgot password?</Link>
          </div>

          <Button type="submit" size="lg" className={styles.w100} disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <div className={styles.ldiv}>or</div>
          <Button
            variant="ghost"
            size="lg"
            className={styles.w100}
            disabled={pending}
            onClick={() => void run(signInWithGoogle)}
          >
            <Icon name="google" size={17} />
            Continue with Google
          </Button>

          <p className={`muted ${styles.signup}`}>
            New to BIOX? <Link title="Sign-up is coming soon">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
