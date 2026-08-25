import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm" style={{ color: "var(--ink-muted)" }}>
        Loading…
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return children;
}
