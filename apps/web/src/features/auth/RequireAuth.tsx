import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

/** Route gate: everything under it needs a signed-in user with a BIOX session. */
export function RequireAuth() {
  const { state } = useAuth();

  // Firebase is still restoring the session — render nothing rather than
  // flashing the login screen on every reload.
  if (state.status === "initializing") return null;
  if (state.status === "signedOut") return <Navigate to="/login" replace />;
  return <Outlet />;
}
