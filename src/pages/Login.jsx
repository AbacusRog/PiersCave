import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--paper)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-xs tracking-widest uppercase font-semibold mb-1" style={{ color: "var(--accent)", letterSpacing: "0.14em" }}>
            Abacus Consultancy
          </div>
          <h1 className="ddt-serif text-2xl font-semibold">Piers Cave Group Register</h1>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-md border p-6 flex flex-col gap-4"
          style={{ background: "var(--card)", borderColor: "var(--rule)" }}
        >
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink-muted)" }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md border"
              style={{ borderColor: "var(--rule)" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink-muted)" }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md border"
              style={{ borderColor: "var(--rule)" }}
            />
          </div>
          {error && (
            <div className="text-xs px-3 py-2 rounded-md" style={{ background: "var(--red-bg)", color: "var(--red)" }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="text-sm font-medium px-3 py-2 rounded-md"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-xs text-center mt-4" style={{ color: "var(--ink-muted)" }}>
          Accounts are created in the Supabase dashboard — there's no self-signup on this register.
        </p>
      </div>
    </div>
  );
}
