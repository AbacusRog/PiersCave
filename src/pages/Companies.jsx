import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import { fmtDate } from "../lib/dueDates";

const EMPTY_FORM = {
  name: "",
  previous_names: "",
  company_number: "",
  incorporation_date: "",
  registered_office: "",
  sic_code: "",
  status: "Active",
  utr: "",
  vat_number: "",
  vat_stagger: "",
  year_end_day: "",
  year_end_month: "",
  notes: "",
};

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function load() {
    const { data } = await supabase.from("companies_view").select("*").order("name");
    setCompanies(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = companies.filter((c) =>
    (c.name + " " + (c.previous_names || "") + " " + c.company_number).toLowerCase().includes(q.toLowerCase())
  );

  async function createCompany(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.company_number.trim()) {
      setError("Name and company number are required.");
      return;
    }
    setSaving(true);
    const payload = { ...form };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") payload[k] = null;
    });
    payload.year_end_day = payload.year_end_day ? Number(payload.year_end_day) : null;
    payload.year_end_month = payload.year_end_month ? Number(payload.year_end_month) : null;

    const { data, error } = await supabase.from("companies").insert(payload).select().single();
    setSaving(false);
    if (error) {
      setError(error.message.includes("duplicate") ? "A company with that number is already in the register." : error.message);
      return;
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    navigate(`/companies/${data.id}`);
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 md:px-8">
      <div className="flex items-start justify-between gap-4 border-b pb-6 mb-6" style={{ borderColor: "var(--rule)" }}>
        <div className="flex flex-col gap-1">
          <span className="text-xs tracking-widest uppercase font-semibold" style={{ color: "var(--accent)", letterSpacing: "0.14em" }}>
            Company Register
          </span>
          <h1 className="ddt-serif text-3xl font-semibold">Companies</h1>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="text-xs font-medium flex items-center gap-1.5 px-3 py-2 rounded-md flex-shrink-0"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? "Cancel" : "New company"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createCompany}
          className="rounded-md border p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3"
          style={{ borderColor: "var(--rule)", background: "var(--card)" }}
        >
          <TextField label="Company name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} wide />
          <TextField label="Previous name(s)" placeholder="e.g. formerly Old Name Ltd (dates)" value={form.previous_names} onChange={(v) => setForm({ ...form, previous_names: v })} wide />
          <TextField label="Company number" required mono value={form.company_number} onChange={(v) => setForm({ ...form, company_number: v })} />
          <TextField label="Incorporation date" type="date" value={form.incorporation_date} onChange={(v) => setForm({ ...form, incorporation_date: v })} />
          <SelectField label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["Active", "Dissolved", "Active — proposal to strike off"]} />
          <TextField label="Registered office" value={form.registered_office} onChange={(v) => setForm({ ...form, registered_office: v })} wide />
          <TextField label="SIC code" value={form.sic_code} onChange={(v) => setForm({ ...form, sic_code: v })} />
          <TextField label="Year end — day" type="number" value={form.year_end_day} onChange={(v) => setForm({ ...form, year_end_day: v })} />
          <TextField label="Year end — month" type="number" value={form.year_end_month} onChange={(v) => setForm({ ...form, year_end_month: v })} />
          <TextField label="UTR" mono value={form.utr} onChange={(v) => setForm({ ...form, utr: v })} />
          <TextField label="VAT number" mono value={form.vat_number} onChange={(v) => setForm({ ...form, vat_number: v })} />
          <TextField label="VAT stagger" placeholder="e.g. Mar / Jun / Sep / Dec" value={form.vat_stagger} onChange={(v) => setForm({ ...form, vat_stagger: v })} />
          <TextField label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} wide textarea />

          {error && (
            <div className="md:col-span-3 text-xs px-3 py-2 rounded-md" style={{ background: "var(--red-bg)", color: "var(--red)" }}>
              {error}
            </div>
          )}
          <div className="md:col-span-3 flex items-center gap-3">
            <button type="submit" disabled={saving} className="text-sm font-medium px-4 py-2 rounded-md" style={{ background: "var(--accent)", color: "#fff" }}>
              {saving ? "Saving…" : "Add company"}
            </button>
            <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
              Directors, PSCs, and shareholders can be added on the company's own page once it's created.
            </span>
          </div>
        </form>
      )}

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

function TextField({ label, value, onChange, wide, textarea, required, placeholder, mono, type = "text" }) {
  const Comp = textarea ? "textarea" : "input";
  return (
    <div className={wide ? "md:col-span-3" : ""}>
      <label className="text-xs font-medium mb-1 block" style={{ color: "var(--ink-muted)" }}>{label}</label>
      <Comp
        type={textarea ? undefined : type}
        required={required}
        placeholder={placeholder}
        rows={textarea ? 2 : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={"w-full text-sm px-3 py-2 rounded-md border " + (mono ? "ddt-mono" : "")}
        style={{ borderColor: "var(--rule)" }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: "var(--ink-muted)" }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm px-3 py-2 rounded-md border"
        style={{ borderColor: "var(--rule)" }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
