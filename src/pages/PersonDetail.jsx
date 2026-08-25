import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Pencil, Save, X, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { fmtDate } from "../lib/dueDates";

const FIELD = "text-sm px-3 py-2 rounded-md border w-full";

export default function PersonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [pscs, setPscs] = useState([]);
  const [shareholders, setShareholders] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [p, o, ps, sh] = await Promise.all([
      supabase.from("people").select("*").eq("id", id).single(),
      supabase.from("company_officers").select("*, companies_view(id, name)").eq("person_id", id),
      supabase.from("company_pscs").select("*, companies_view(id, name)").eq("person_id", id),
      supabase.from("company_shareholders").select("*, companies_view(id, name)").eq("person_id", id),
    ]);
    setPerson(p.data);
    setForm(p.data);
    setOfficers(o.data || []);
    setPscs(ps.data || []);
    setShareholders(sh.data || []);
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
    const { error } = await supabase.from("people").update(payload).eq("id", id);
    setSaving(false);
    if (error) {
      alert("Couldn't save: " + error.message);
      return;
    }
    setEditing(false);
    load();
  }

  async function remove() {
    if (!confirm(`Delete ${person.full_name}? This also removes their director/PSC/shareholder links.`)) return;
    const { error } = await supabase.from("people").delete().eq("id", id);
    if (error) {
      alert("Couldn't delete: " + error.message);
      return;
    }
    navigate("/people");
  }

  if (!person) return <div className="p-8 text-sm" style={{ color: "var(--ink-muted)" }}>Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 md:px-8">
      <Link to="/people" className="text-xs font-medium" style={{ color: "var(--accent)" }}>← All people</Link>

      <div className="flex items-start justify-between gap-4 mt-3 mb-6">
        {editing ? (
          <input
            className="ddt-serif text-3xl font-semibold w-full px-2 py-1 rounded-md border"
            style={{ borderColor: "var(--rule)" }}
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        ) : (
          <h1 className="ddt-serif text-3xl font-semibold">{person.full_name}</h1>
        )}
        {!editing ? (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setEditing(true)} className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md border" style={{ borderColor: "var(--rule)" }}>
              <Pencil size={13} /> Edit
            </button>
            <button onClick={remove} className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md border" style={{ borderColor: "var(--rule)", color: "var(--red)" }}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        ) : (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => { setEditing(false); setForm(person); }} className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md border" style={{ borderColor: "var(--rule)" }}>
              <X size={13} /> Cancel
            </button>
            <button onClick={save} disabled={saving} className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md" style={{ background: "var(--accent)", color: "#fff" }}>
              <Save size={13} /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <EditField label="Born (month year)" value={form.dob_month_year} onChange={(v) => setForm({ ...form, dob_month_year: v })} />
          <EditField label="Nationality" value={form.nationality} onChange={(v) => setForm({ ...form, nationality: v })} />
          <EditField label="Country of residence" value={form.country_of_residence} onChange={(v) => setForm({ ...form, country_of_residence: v })} />
          <EditField label="Occupation" value={form.occupation} onChange={(v) => setForm({ ...form, occupation: v })} />
          <EditField label="Correspondence address" value={form.correspondence_address} onChange={(v) => setForm({ ...form, correspondence_address: v })} wide />
          <EditField label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} wide textarea />
        </div>
      ) : (
        <div className="text-sm mb-6 flex flex-wrap gap-x-4 gap-y-1" style={{ color: "var(--ink-muted)" }}>
          {person.dob_month_year && <span>Born {person.dob_month_year}</span>}
          {person.nationality && <span>{person.nationality}</span>}
          {person.country_of_residence && <span>Resident: {person.country_of_residence}</span>}
          {person.occupation && <span>{person.occupation}</span>}
        </div>
      )}
      {!editing && person.correspondence_address && (
        <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>{person.correspondence_address}</p>
      )}

      <Section title="Companies (as director / secretary)">
        {officers.length === 0 ? <Empty /> : officers.map((o) => (
          <CompanyRow key={o.id} co={o.companies_view} sub={`${o.role} · appointed ${fmtDate(o.appointed_on)}${o.status === "Resigned" ? " · resigned" : ""}`} />
        ))}
      </Section>

      <Section title="Persons with significant control">
        {pscs.length === 0 ? <Empty /> : pscs.map((p) => <CompanyRow key={p.id} co={p.companies_view} sub={p.nature_of_control} />)}
      </Section>

      <Section title="Shareholdings">
        {shareholders.length === 0 ? <Empty /> : shareholders.map((s) => (
          <CompanyRow key={s.id} co={s.companies_view} sub={`${s.shares_held ?? "—"} ${s.share_class} shares`} />
        ))}
      </Section>

      {!editing && person.notes && (
        <p className="text-xs italic mt-6" style={{ color: "var(--ink-muted)" }}>{person.notes}</p>
      )}
    </div>
  );
}

function EditField({ label, value, onChange, wide, textarea }) {
  const Comp = textarea ? "textarea" : "input";
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <div className="text-xs font-medium mb-1" style={{ color: "var(--ink-muted)" }}>{label}</div>
      <Comp
        rows={textarea ? 2 : undefined}
        className={FIELD}
        style={{ borderColor: "var(--rule)" }}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--ink-muted)", letterSpacing: "0.08em" }}>{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function CompanyRow({ co, sub }) {
  if (!co) return null;
  return (
    <Link
      to={`/companies/${co.id}`}
      className="rounded-md border p-3 flex items-center justify-between hover:shadow-sm"
      style={{ borderColor: "var(--rule)", background: "var(--card)" }}
    >
      <span className="font-medium text-sm">{co.name}</span>
      <span className="text-xs" style={{ color: "var(--ink-muted)" }}>{sub}</span>
    </Link>
  );
}

function Empty() {
  return <div className="text-sm italic" style={{ color: "var(--ink-muted)" }}>None on file.</div>;
}
