import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpDown, Info } from "lucide-react";
import { supabase } from "../supabaseClient";
import { fmtDate, statusOf, STATUS_STYLE, TASK_TYPES } from "../lib/dueDates";
import StatusBadge from "../components/StatusBadge";

const TAB_COLORS = ["#0B5563", "#6B4C7A", "#9C6B14", "#35507A", "#7A3B3B", "#3D6657"];

export default function DueDates() {
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ownerFilter, setOwnerFilter] = useState("ALL");
  const [taskFilter, setTaskFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState("dueBy");
  const [sortDir, setSortDir] = useState("asc");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const [dd, co, pp] = await Promise.all([
        supabase.from("due_dates").select("*"),
        supabase.from("companies_view").select("id, name, previous_names, company_number"),
        supabase.from("people").select("id, full_name"),
      ]);
      if (dd.error || co.error || pp.error) {
        setError((dd.error || co.error || pp.error).message);
        setLoading(false);
        return;
      }

      const coMap = Object.fromEntries(co.data.map((c, i) => [c.id, { ...c, color: TAB_COLORS[i % TAB_COLORS.length] }]));
      const ppMap = Object.fromEntries(pp.data.map((p, i) => [p.id, { ...p, color: TAB_COLORS[(co.data.length + i) % TAB_COLORS.length] }]));

      const joined = dd.data.map((r) => {
        const owner = r.company_id ? coMap[r.company_id] : ppMap[r.person_id];
        return {
          ...r,
          ownerKey: r.company_id || r.person_id,
          ownerName: owner ? (owner.name || owner.full_name) : "Unknown",
          ownerSub: owner ? owner.company_number || "Personal — Self Assessment" : "",
          ownerColor: owner ? owner.color : "#999",
          status: statusOf(r.due_by, today),
        };
      });

      setCompanies([
        ...co.data.map((c, i) => ({ id: c.id, name: c.name, sub: c.company_number, color: TAB_COLORS[i % TAB_COLORS.length] })),
        ...pp.data.map((p, i) => ({
          id: p.id,
          name: p.full_name,
          sub: "Personal — Self Assessment",
          color: TAB_COLORS[(co.data.length + i) % TAB_COLORS.length],
        })),
      ]);
      setRows(joined);
      setLoading(false);
    }
    load();
  }, [today]);

  const counts = useMemo(() => {
    const c = { overdue: 0, red: 0, amber: 0, green: 0 };
    rows.forEach((r) => c[r.status]++);
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    let r = rows;
    if (ownerFilter !== "ALL") r = r.filter((x) => x.ownerKey === ownerFilter);
    if (taskFilter !== "ALL") r = r.filter((x) => x.task_type === taskFilter);
    return r;
  }, [rows, ownerFilter, taskFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      if (sortKey === "dueBy") return (a.due_by < b.due_by ? -1 : a.due_by > b.due_by ? 1 : 0) * dir;
      if (sortKey === "owner") return a.ownerName.localeCompare(b.ownerName) * dir;
      if (sortKey === "task") return a.task_type.localeCompare(b.task_type) * dir;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (loading) return <div className="p-8 text-sm" style={{ color: "var(--ink-muted)" }}>Loading due dates…</div>;
  if (error) return <div className="p-8 text-sm" style={{ color: "var(--red)" }}>Couldn't load due dates: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 md:px-8">
      <div className="flex flex-col gap-1 border-b pb-6 mb-6" style={{ borderColor: "var(--rule)" }}>
        <span className="text-xs tracking-widest uppercase font-semibold" style={{ color: "var(--accent)", letterSpacing: "0.14em" }}>
          Abacus Consultancy · Compliance Register
        </span>
        <h1 className="ddt-serif text-3xl md:text-4xl font-semibold">Due Dates Tracker</h1>
        <p className="text-sm md:text-base" style={{ color: "var(--ink-muted)" }}>
          Piers Cave — group companies &amp; personal Self Assessment
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { key: "overdue", label: "Overdue" },
          { key: "red", label: "Due within 1 month" },
          { key: "amber", label: "Due within 2 months" },
          { key: "green", label: "On track" },
        ].map((s) => (
          <div key={s.key} className="rounded-md p-4 border flex items-center justify-between" style={{ background: STATUS_STYLE[s.key].bg, borderColor: "var(--rule)" }}>
            <div>
              <div className="text-2xl font-semibold ddt-mono" style={{ color: STATUS_STYLE[s.key].text }}>
                {counts[s.key]}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>{s.label}</div>
            </div>
            <span className="inline-block rounded-full" style={{ width: 10, height: 10, background: STATUS_STYLE[s.key].dot }} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold uppercase mr-1" style={{ color: "var(--ink-muted)", letterSpacing: "0.08em" }}>
            Filing tab
          </span>
          <button
            onClick={() => setOwnerFilter("ALL")}
            className="ddt-chip text-xs px-3 py-1.5 rounded-full border font-medium"
            style={ownerFilter === "ALL" ? { background: "var(--ink)", color: "var(--card)", borderColor: "var(--ink)" } : { background: "var(--card)", borderColor: "var(--rule)" }}
          >
            All
          </button>
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => setOwnerFilter(c.id)}
              className="ddt-chip text-xs pl-2.5 pr-3 py-1.5 rounded-full border font-medium flex items-center gap-1.5"
              style={ownerFilter === c.id ? { background: c.color, color: "#fff", borderColor: c.color } : { background: "var(--card)", borderColor: "var(--rule)" }}
            >
              <span className="inline-block rounded-sm" style={{ width: 8, height: 8, background: ownerFilter === c.id ? "#fff" : c.color }} />
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold uppercase mr-1" style={{ color: "var(--ink-muted)", letterSpacing: "0.08em" }}>
            Task
          </span>
          <button
            onClick={() => setTaskFilter("ALL")}
            className="ddt-chip text-xs px-3 py-1.5 rounded-full border font-medium"
            style={taskFilter === "ALL" ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : { background: "var(--card)", borderColor: "var(--rule)" }}
          >
            All
          </button>
          {TASK_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTaskFilter(t)}
              className="ddt-chip text-xs px-3 py-1.5 rounded-full border font-medium"
              style={taskFilter === t ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : { background: "var(--card)", borderColor: "var(--rule)" }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table (md+) */}
      <div className="hidden md:block rounded-md border overflow-hidden" style={{ borderColor: "var(--rule)", background: "var(--card)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "var(--paper)" }}>
                <th className="w-2"></th>
                <th className="text-left px-3 py-3 font-semibold text-xs uppercase" style={{ color: "var(--ink-muted)", letterSpacing: "0.06em" }}>Status</th>
                <SortableTh label="Company / Person" active={sortKey === "owner"} dir={sortDir} onClick={() => toggleSort("owner")} />
                <SortableTh label="Task" active={sortKey === "task"} dir={sortDir} onClick={() => toggleSort("task")} />
                <th className="text-left px-3 py-3 font-semibold text-xs uppercase" style={{ color: "var(--ink-muted)", letterSpacing: "0.06em" }}>Due Date</th>
                <SortableTh label="Due By" active={sortKey === "dueBy"} dir={sortDir} onClick={() => toggleSort("dueBy")} />
                <th className="text-left px-3 py-3 font-semibold text-xs uppercase" style={{ color: "var(--ink-muted)", letterSpacing: "0.06em" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                return (
                  <tr key={r.id} className="ddt-row border-t" style={{ borderColor: "var(--rule-soft)" }}>
                    <td style={{ background: r.ownerColor, width: 4 }}></td>
                    <td className="px-3 py-3">
                      <StatusBadge status={r.status} dueBy={r.due_by} today={today} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{r.ownerName}</div>
                      <div className="text-xs ddt-mono" style={{ color: "var(--ink-muted)" }}>{r.ownerSub}</div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{r.task_type}</td>
                    <td className="px-3 py-3 ddt-mono whitespace-nowrap">{fmtDate(r.due_date)}</td>
                    <td className="px-3 py-3 ddt-mono whitespace-nowrap font-medium">{fmtDate(r.due_by)}</td>
                    <td className="px-3 py-3 text-xs" style={{ color: "var(--ink-muted)", maxWidth: 260 }}>
                      {r.amount && <div className="ddt-mono font-medium" style={{ color: "var(--ink)" }}>{r.amount}</div>}
                      {r.note && <div>{r.note}</div>}
                      {r.flag && (
                        <div className="flex items-start gap-1 mt-1" style={{ color: "var(--amber)" }}>
                          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                          <span>{r.flag}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card list (mobile) */}
      <div className="md:hidden flex flex-col gap-3">
        {sorted.map((r) => (
          <div key={r.id} className="rounded-md border p-4" style={{ borderColor: "var(--rule)", background: "var(--card)", borderLeft: `4px solid ${r.ownerColor}` }}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="font-medium">{r.ownerName}</div>
                <div className="text-xs ddt-mono" style={{ color: "var(--ink-muted)" }}>{r.ownerSub}</div>
              </div>
              <StatusBadge status={r.status} dueBy={r.due_by} today={today} />
            </div>
            <div className="text-sm font-medium mb-1">{r.task_type}</div>
            <div className="flex gap-4 text-xs ddt-mono mb-1" style={{ color: "var(--ink-muted)" }}>
              <span>Due Date: {fmtDate(r.due_date)}</span>
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>Due By: {fmtDate(r.due_by)}</span>
            </div>
            {r.amount && <div className="text-xs ddt-mono font-medium">{r.amount}</div>}
            {r.note && <div className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>{r.note}</div>}
            {r.flag && (
              <div className="flex items-start gap-1 mt-1 text-xs" style={{ color: "var(--amber)" }}>
                <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                <span>{r.flag}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-10 text-sm" style={{ color: "var(--ink-muted)" }}>
          No items match this filter combination.
        </div>
      )}

      <div className="mt-8 pt-5 border-t flex flex-col gap-2 text-xs" style={{ borderColor: "var(--rule)", color: "var(--ink-muted)" }}>
        <div className="flex items-start gap-2">
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          <p>
            <strong style={{ color: "var(--ink)" }}>Due Date</strong> is the period end, statement anniversary, or filed date;{" "}
            <strong style={{ color: "var(--ink)" }}>Due By</strong> is the computed deadline. Rows are entered by hand each
            cycle and never auto-advance — add the next occurrence once one is filed. Status: red = within 1 month,
            amber = within 2 months, green = everything else, dark red = overdue.
          </p>
        </div>
      </div>
    </div>
  );
}

function SortableTh({ label, active, dir, onClick }) {
  return (
    <th
      className="text-left px-3 py-3 font-semibold text-xs uppercase cursor-pointer select-none"
      style={{ color: active ? "var(--accent)" : "var(--ink-muted)", letterSpacing: "0.06em" }}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={11} style={{ opacity: active ? 1 : 0.4, transform: active && dir === "desc" ? "scaleY(-1)" : "none" }} />
      </span>
    </th>
  );
}
