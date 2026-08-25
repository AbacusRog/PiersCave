import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import RelationshipGraph from "../components/RelationshipGraph";

const EMPTY_FORM = {
  full_name: "",
  dob_month_year: "",
  nationality: "",
  country_of_residence: "",
  occupation: "",
  correspondence_address: "",
  notes: "",
};

export default function People() {
  const [people, setPeople] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function load() {
    const [pp, co, off, psc, sh] = await Promise.all([
      supabase.from("people").select("id, full_name").order("full_name"),
      supabase.from("companies_view").select("id, name").order("name"),
      supabase.from("company_officers").select("person_id, company_id"),
      supabase.from("company_pscs").select("person_id, company_id"),
      supabase.from("company_shareholders").select("person_id, company_id"),
    ]);
    setPeople(pp.data || []);
    setCompanies(co.data || []);
    setLinks([
      ...(off.data || []).map((l) => ({ personId: l.person_id, companyId: l.company_id, role: "Director" })),
      ...(psc.data || []).map((l) => ({ personId: l.person_id, companyId: l.company_id, role: "PSC" })),
      ...(sh.data || []).map((l) => ({ personId: l.person_id, companyId: l.company_id, role: "Shareholder" })),
    ]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createPerson(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const { data, error } = await supabase.from("people").insert(form).select().single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    navigate(`/people/${data.id}`);
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 md:px-8">
      <div className="flex items-start justify-between gap-4 border-b pb-6 mb-6" style={{ borderColor: "var(--rule)" }}>
        <div className="flex flex-col gap-1">
          <span className="text-xs tracking-widest uppercase font-semibold" style={{ color: "var(--accent)", letterSpacing: "0.14em" }}>
            Company Register
          </span>
          <h1 className="ddt-serif text-3xl font-semibold">People</h1>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>Directors, PSCs, and shareholders across every company in the register.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="text-xs font-medium flex items-center gap-1.5 px-3 py-2 rounded-md flex-shrink-0"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {showForm ? <X size={13} /> : <UserPlus size={13} />}
          {showForm ? "Cancel" : "New person"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createPerson}
          className="rounded-md border p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3"
          style={{ borderColor: "var(--rule)", background: "var(--card)" }}
        >
          <TextField label="Full name" required value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} wide />
          <TextField label="Born (month year)" placeholder="e.g. November 1971" value={form.dob_month_year} onChange={(v) => setForm({ ...form, dob_month_year: v })} />
          <TextField label="Nationality" value={form.nationality} onChange={(v) => setForm({ ...form, nationality: v })} />
          <TextField label="Country of residence" value={form.country_of_residence} onChange={(v) => setForm({ ...form, country_of_residence: v })} />
          <TextField label="Occupation" value={form.occupation} onChange={(v) => setForm({ ...form, occupation: v })} />
          <TextField label="Correspondence address" value={form.correspondence_address} onChange={(v) => setForm({ ...form, correspondence_address: v })} wide />
          <TextField label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} wide textarea />
          {error && (
            <div className="md:col-span-2 text-xs px-3 py-2 rounded-md" style={{ background: "var(--red-bg)", color: "var(--red)" }}>
              {error}
            </div>
          )}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="text-sm font-medium px-4 py-2 rounded-md"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {saving ? "Saving…" : "Add person"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm" style={{ color: "var(--ink-muted)" }}>Loading…</div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 mb-8">
            {people.map((p) => (
              <Link
                key={p.id}
                to={`/people/${p.id}`}
                className="rounded-md border p-4 block hover:shadow-sm"
                style={{ borderColor: "var(--rule)", background: "var(--card)" }}
              >
                <div className="font-medium">{p.full_name}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
                  {links.filter((l) => l.personId === p.id).length} relationship
                  {links.filter((l) => l.personId === p.id).length === 1 ? "" : "s"} on file
                </div>
              </Link>
            ))}
            {people.length === 0 && (
              <div className="text-sm" style={{ color: "var(--ink-muted)" }}>No people yet — add one above.</div>
            )}
          </div>

          <h2 className="text-xs font-semibold uppercase mb-3" style={{ color: "var(--ink-muted)", letterSpacing: "0.08em" }}>
            Relationship map
          </h2>
          <div className="rounded-md border p-4" style={{ borderColor: "var(--rule)", background: "var(--card)" }}>
            <RelationshipGraph people={people} companies={companies} links={links} />
          </div>
        </>
      )}
    </div>
  );
}

function TextField({ label, value, onChange, wide, textarea, required, placeholder }) {
  const Comp = textarea ? "textarea" : "input";
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label className="text-xs font-medium mb-1 block" style={{ color: "var(--ink-muted)" }}>{label}</label>
      <Comp
        required={required}
        placeholder={placeholder}
        rows={textarea ? 2 : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm px-3 py-2 rounded-md border"
        style={{ borderColor: "var(--rule)" }}
      />
    </div>
  );
}
