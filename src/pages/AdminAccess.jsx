import { useEffect, useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function AdminAccess() {
  const [admins, setAdmins] = useState([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("admin_users").select("*").order("created_at");
    setAdmins(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addAdmin(e) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.rpc("admin_add_by_email", { target_email: email });
    if (error) {
      setError(error.message);
      return;
    }
    setEmail("");
    load();
  }

  async function removeAdmin(userId) {
    if (!confirm("Remove admin access for this user?")) return;
    const { error } = await supabase.rpc("admin_remove", { target_user_id: userId });
    if (error) {
      alert(error.message);
      return;
    }
    load();
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 md:px-8">
      <div className="flex flex-col gap-1 border-b pb-6 mb-6" style={{ borderColor: "var(--rule)" }}>
        <span className="text-xs tracking-widest uppercase font-semibold" style={{ color: "var(--accent)", letterSpacing: "0.14em" }}>
          Settings
        </span>
        <h1 className="ddt-serif text-3xl font-semibold">Admin Access</h1>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          Admins can see and edit each company's Authentication Code, and manage this list. Everyone signed in can see and edit everything else.
        </p>
      </div>

      <form onSubmit={addAdmin} className="flex gap-2 mb-6">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="person@example.com"
          className="flex-1 text-sm px-3 py-2 rounded-md border"
          style={{ borderColor: "var(--rule)" }}
        />
        <button
          type="submit"
          className="text-sm font-medium flex items-center gap-1.5 px-3 py-2 rounded-md"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <UserPlus size={14} /> Add admin
        </button>
      </form>
      {error && (
        <div className="text-xs px-3 py-2 rounded-md mb-4" style={{ background: "var(--red-bg)", color: "var(--red)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm" style={{ color: "var(--ink-muted)" }}>Loading…</div>
      ) : (
        <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--rule)" }}>
          {admins.map((a) => (
            <div
              key={a.user_id}
              className="flex items-center justify-between px-4 py-3 border-t first:border-t-0"
              style={{ borderColor: "var(--rule-soft)", background: "var(--card)" }}
            >
              <span className="text-sm">{a.email}</span>
              <button onClick={() => removeAdmin(a.user_id)} className="text-xs flex items-center gap-1" style={{ color: "var(--red)" }}>
                <Trash2 size={13} /> Remove
              </button>
            </div>
          ))}
          {admins.length === 0 && (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--ink-muted)" }}>No admins yet.</div>
          )}
        </div>
      )}

      <p className="text-xs mt-4" style={{ color: "var(--ink-muted)" }}>
        A person must already have signed in at least once (i.e. have a Supabase Auth account) before they can be added here.
      </p>
    </div>
  );
}
