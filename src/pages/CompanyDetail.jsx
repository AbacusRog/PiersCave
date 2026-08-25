import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Pencil, Save, X, Lock, Check, Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../lib/auth";
import { fmtDate, statusOf, withinWindow, markDoneAndAdvance } from "../lib/dueDates";
import StatusBadge from "../components/StatusBadge";
import RelationshipSection from "../components/RelationshipSection";

const FIELD = "text-sm px-3 py-2 rounded-md border w-full";

const OFFICER_FIELDS = [
  { key: "role", label: "Role", type: "select", options: ["Director", "Secretary"], default: "Director" },
  { key: "appointed_on", label: "Appointed", type: "date" },
  { key: "resigned_on", label: "Resigned", type: "date" },
  { key: "status", label: "Status", type: "select", options: ["Active", "Resigned"], default: "Active" },
  { key: "notes", label: "Notes", type: "text" },
];
const PSC_FIELDS = [
  { key: "nature_of_control", label: "Nature of control", type: "text" },
  { key: "notified_on", label: "Notified", type: "date" },
  { key: "notes", label: "Notes", type: "text" },
];
const SHAREHOLDER_FIELDS = [
  { key: "share_class", label: "Class", type: "text", default: "Ordinary" },
  { key: "shares_held", label: "Shares", type: "number" },
  { key: "currency", label: "Currency", type: "text", default: "GBP" },
  { key: "notes", label: "Notes", type: "text" },
];

export default function CompanyDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [company, setCompany] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [pscs, setPscs] = useState([]);
  const [shareholders, setShareholders] = useState([]);
  const [dueDates, setDueDates] = useState([]);
  const [people, setPeople] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  async function load() {
    const [c, o, p, s, d, pp] = await Promise.all([
      supabase.from("companies_view").select("*").eq("id", id).single(),
      supabase.from("company_officers").select("*, people(id, full_name)").eq("company_id", id).order("appointed_on"),
      supabase.from("company_pscs").select("*, people(id, full_name)").eq("company_id", id),
      supabase.from("company_shareholders").select("*, people(id, full_name)").eq("company_id", id),
      supabase.from("due_dates").select("*").eq("company_id", id).order("due_by"),
      supabase.from("people").select("id, full_name").order("full_name"),
    ]);
    setCompany(c.data);
    setForm(c.data);
    setOfficers(o.data || []);
    setPscs(p.data || []);
    setShareholders(s.data || []);
    setDueDates(d.data || []);
    setPeople(pp.data || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save() {
    setSaving(true);
    const payload = { ...form };
    delete payload.id;
    delete payload.created_at;
    if (!isAdmin) delete payload.authentication_code; // trigger would strip it anyway, but avoid sending
    const { error } = await supabase.from("companies").update(payload).eq("id", id);
    setSaving(false);
    if (!error) {
      setEditing(false);
      load();
    } else {
      alert("Couldn't save: " + error.message);
    }
  }

  async function handleMarkDone(row) {
    setBusyId(row.id);
    const { error } = await markDoneAndAdvance(supabase, row);
    setBusyId(null);
    if (error) {
      alert("Couldn't mark this as done: " + error.message);
      return;
    }
    load();
  }

  if (!company) return <div className="p-8 text-sm" style={{ color: "var(--ink-muted)" }}>Loading…</div>;

  const visibleDueDates = dueDates.filter((d) => (showCompleted || !d.filed) && (d.filed || withinWindow(d.due_by, today)));

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 md:px-8">
      <Link to="/companies" className="text-xs font-medium" style={{ color: "var(--accent)" }}>← All companies</Link>

      <div className="flex items-start justify-between gap-4 mt-3 mb-6">
        <div>
          <h1 className="ddt-serif text-3xl font-semibold">{company.name}</h1>
          {company.previous_names && (
            <p className="text-sm mt-0.5" style={{ color: "var(--ink-muted)" }}>{company.previous_names}</p>
          )}
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md border flex-shrink-0"
            style={{ borderColor: "var(--rule)" }}
          >
            <Pencil size={13} /> Edit
          </button>
        ) : (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => { setEditing(false); setForm(company); }}
              className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md border"
              style={{ borderColor: "var(--rule)" }}
            >
              <X size={13} /> Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Save size={13} /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Core details */}
      <Section title="Company details">
        <Grid>
          <FieldRow label="Company number" value={company.company_number} mono />
          <FieldRow label="Status" value={company.status} editing={editing} onChange={(v) => setForm({ ...form, status: v })} formValue={form?.status} />
          <FieldRow label="Incorporated" value={fmtDate(company.incorporation_date)} mono />
          <FieldRow label="SIC code" value={company.sic_code} editing={editing} onChange={(v) => setForm({ ...form, sic_code: v })} formValue={form?.sic_code} />
          <FieldRow label="Registered office" value={company.registered_office} editing={editing} onChange={(v) => setForm({ ...form, registered_office: v })} formValue={form?.registered_office} wide />
          <FieldRow label="Year end" value={company.year_end_day && company.year_end_month ? `${company.year_end_day}/${company.year_end_month}` : "—"} mono />
          <FieldRow label="UTR" value={company.utr} editing={editing} onChange={(v) => setForm({ ...form, utr: v })} formValue={form?.utr} mono />
          <FieldRow label="VAT number" value={company.vat_number} editing={editing} onChange={(v) => setForm({ ...form, vat_number: v })} formValue={form?.vat_number} mono />
          <FieldRow label="VAT stagger" value={company.vat_stagger} editing={editing} onChange={(v) => setForm({ ...form, vat_stagger: v })} formValue={form?.vat_stagger} />
          <div>
            <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: "var(--ink-muted)" }}>
              Authentication code {!isAdmin && <Lock size={11} />}
            </div>
            {isAdmin ? (
              editing ? (
                <input className={FIELD} style={{ borderColor: "var(--rule)" }} value={form?.authentication_code || ""} onChange={(e) => setForm({ ...form, authentication_code: e.target.value })} />
              ) : (
                <div className="text-sm ddt-mono">{company.authentication_code || "—"}</div>
              )
            ) : (
              <div className="text-sm italic" style={{ color: "var(--ink-muted)" }}>Admins only</div>
            )}
          </div>
        </Grid>
        {editing && (
          <div className="mt-3">
            <div className="text-xs font-medium mb-1" style={{ color: "var(--ink-muted)" }}>Notes</div>
            <textarea className={FIELD} rows={2} style={{ borderColor: "var(--rule)" }} value={form?.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        )}
        {!editing && company.notes && (
          <div className="text-xs mt-3 italic" style={{ color: "var(--ink-muted)" }}>{company.notes}</div>
        )}
      </Section>

      {/* Officers */}
      <Section title="Officers">
        <RelationshipSection table="company_officers" companyId={id} rows={officers} people={people} fields={OFFICER_FIELDS} onChange={load} />
      </Section>

      {/* PSC */}
      <Section title="Persons with significant control">
        <RelationshipSection table="company_pscs" companyId={id} rows={pscs} people={people} fields={PSC_FIELDS} onChange={load} />
      </Section>

      {/* Shareholders */}
      <Section title="Shareholders">
        <RelationshipSection table="company_shareholders" companyId={id} rows={shareholders} people={people} fields={SHAREHOLDER_FIELDS} onChange={load} />
      </Section>

      {/* Due dates */}
      <Section
        title="Due dates (next 24 months)"
        right={
          <label className="text-xs font-medium flex items-center gap-1.5 select-none" style={{ color: "var(--ink-muted)" }}>
            <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
            Show completed
          </label>
        }
      >
        <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--rule)" }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "var(--paper)" }}>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: "var(--ink-muted)" }}>Task</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: "var(--ink-muted)" }}>Due Date</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: "var(--ink-muted)" }}>Due By</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: "var(--ink-muted)" }}>Status</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: "var(--ink-muted)" }}></th>
              </tr>
            </thead>
            <tbody>
              {visibleDueDates.map((d) => (
                <tr key={d.id} className="ddt-row border-t" style={{ borderColor: "var(--rule-soft)", opacity: d.filed ? 0.55 : 1 }}>
                  <td className="px-3 py-2">{d.task_type}</td>
                  <td className="px-3 py-2 ddt-mono">{fmtDate(d.due_date)}</td>
                  <td className="px-3 py-2 ddt-mono font-medium">{fmtDate(d.due_by)}</td>
                  <td className="px-3 py-2">
                    {d.filed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full" style={{ background: "var(--green-bg)", color: "var(--green)" }}>
                        <Check size={11} /> Filed
                      </span>
                    ) : (
                      <StatusBadge status={statusOf(d.due_by, today)} dueBy={d.due_by} today={today} />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {!d.filed && (
                      <button
                        onClick={() => handleMarkDone(d)}
                        disabled={busyId === d.id}
                        className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-md border"
                        style={{ borderColor: "var(--rule)" }}
                      >
                        {busyId === d.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Mark done
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {visibleDueDates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-sm text-center" style={{ color: "var(--ink-muted)" }}>
                    Nothing due in the next 24 months.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, right, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase" style={{ color: "var(--ink-muted)", letterSpacing: "0.08em" }}>{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{children}</div>;
}

function FieldRow({ label, value, mono, editing, formValue, onChange, wide }) {
  return (
    <div className={wide ? "col-span-2 md:col-span-3" : ""}>
      <div className="text-xs font-medium mb-1" style={{ color: "var(--ink-muted)" }}>{label}</div>
      {editing && onChange ? (
        <input className={FIELD} style={{ borderColor: "var(--rule)" }} value={formValue || ""} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className={"text-sm " + (mono ? "ddt-mono" : "")}>{value || "—"}</div>
      )}
    </div>
  );
}
