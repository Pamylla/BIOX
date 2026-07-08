import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import type { UserProfile } from "@biox/shared/contracts";
import { getFirebaseAuth } from "../../lib/firebase";
import { createSession } from "./session";

export type AuthState =
  | { status: "initializing" }
  | { status: "signedOut" }
  | { status: "signedIn"; profile: UserProfile };

interface AuthContextValue {
  state: AuthState;
  /** Post-auth failures (session provisioning, missing Firebase env) — sign-in call errors reject directly. */
  sessionError: string | null;
  signInWithEmail(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * The real auth flow (plan Fase 3): Firebase JS SDK authenticates, the ID
 * token is exchanged at POST /v1/auth/session, and only then the user is
 * signedIn. Restored sessions (page reload) follow the same path through
 * onAuthStateChanged.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "initializing" });
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : String(error));
      setState({ status: "signedOut" });
      return;
    }

    // Each emission bumps the epoch; an in-flight createSession only commits if
    // it is still the latest. Without this, a slow sign-in can resolve after a
    // later sign-out and revive a phantom signedIn state (e.g. cross-tab logout).
    let epoch = 0;

    return onAuthStateChanged(auth, (user) => {
      const current = ++epoch;
      if (!user) {
        setState({ status: "signedOut" });
        return;
      }
      void (async () => {
        try {
          const profile = await createSession(await user.getIdToken());
          if (current !== epoch) return;
          setSessionError(null);
          setState({ status: "signedIn", profile });
        } catch (error) {
          if (current !== epoch) return;
          // Authenticated at Firebase but not provisioned locally — stay signed
          // out so the login screen can explain instead of half-working.
          setSessionError(error instanceof Error ? error.message : String(error));
          await firebaseSignOut(auth);
        }
      })();
    });
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  const value = useMemo(
    () => ({ state, sessionError, signInWithEmail, signInWithGoogle, signOut }),
    [state, sessionError, signInWithEmail, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
