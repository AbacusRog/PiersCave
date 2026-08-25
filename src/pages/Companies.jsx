import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { supabase } from "../supabaseClient";
import { fmtDate } from "../lib/dueDates";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("companies_view")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setCompanies(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = companies.filter((c) =>
    (c.name + " " + (c.previous_names || "") + " " + c.company_number).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 md:px-8">
      <div className="flex flex-col gap-1 border-b pb-6 mb-6" style={{ borderColor: "var(--rule)" }}>
        <span className="text-xs tracking-widest uppercase font-semibold" style={{ color: "var(--accent)", letterSpacing: "0.14em" }}>
          Company Register
        </span>
        <h1 className="ddt-serif text-3xl font-semibold">Companies</h1>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or company number…"
          className="w-full text-sm pl-9 pr-3 py-2 rounded-md border"
          style={{ borderColor: "var(--rule)", background: "var(--card)" }}
        />
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: "var(--ink-muted)" }}>Loading…</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to={`/companies/${c.id}`}
              className="rounded-md border p-4 block hover:shadow-sm"
              style={{ borderColor: "var(--rule)", background: "var(--card)" }}
            >
              <div className="font-medium mb-0.5">{c.name}</div>
              {c.previous_names && (
                <div className="text-xs mb-1" style={{ color: "var(--ink-muted)" }}>{c.previous_names}</div>
              )}
              <div className="text-xs ddt-mono flex flex-wrap gap-x-3 gap-y-0.5" style={{ color: "var(--ink-muted)" }}>
                <span>No. {c.company_number}</span>
                <span>Inc. {fmtDate(c.incorporation_date)}</span>
                <span>{c.status}</span>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm col-span-2" style={{ color: "var(--ink-muted)" }}>No companies match "{q}".</div>
          )}
        </div>
      )}
    </div>
  );
}
