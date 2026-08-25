import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Generic add/edit/remove UI for a company <-> person relationship table
// (company_officers, company_pscs, company_shareholders). `fields`
// describes the columns beyond person_id/company_id, e.g.:
//   [{ key: 'role', label: 'Role', type: 'select', options: [...] }, ...]
//
// Two modes, depending on which page it's used from:
//   - companyId + people: fixed company, pick the person (CompanyDetail)
//   - personId + companies: fixed person, pick the company (PersonDetail)

const INPUT = "text-xs px-2 py-1.5 rounded-md border w-full";

export default function RelationshipSection({ table, companyId, people, personId, companies, rows, fields, onChange }) {
  const mode = companyId ? "byCompany" : "byPerson";
  const options = mode === "byCompany" ? people : companies;
  const optionLabel = (o) => (mode === "byCompany" ? o.full_name : o.name);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function emptyForm() {
    const f = { pick: "" };
    fields.forEach((fl) => (f[fl.key] = fl.default ?? ""));
    return f;
  }

  function startAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setAdding(true);
    setError("");
  }

  function startEdit(row) {
    const f = { pick: mode === "byCompany" ? row.person_id : row.company_id };
    fields.forEach((fl) => (f[fl.key] = row[fl.key] ?? ""));
    setForm(f);
    setEditingId(row.id);
    setAdding(false);
    setError("");
  }

  function cancel() {
    setAdding(false);
    setEditingId(null);
    setError("");
  }

  function buildPayload(withOwner) {
    const payload = withOwner
      ? mode === "byCompany"
        ? { company_id: companyId, person_id: form.pick }
        : { person_id: personId, company_id: form.pick }
      : {};
    fields.forEach((fl) => (payload[fl.key] = form[fl.key] === "" ? null : form[fl.key]));
    return payload;
  }

  async function submitAdd(e) {
    e.preventDefault();
    if (!form.pick) {
      setError(mode === "byCompany" ? "Choose a person first." : "Choose a company first.");
      return;
    }
    setError("");
    setSaving(true);
    const { error } = await supabase.from(table).insert(buildPayload(true));
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setAdding(false);
    onChange();
  }

  async function submitEdit(e, rowId) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = buildPayload(false);
    if (mode === "byCompany") payload.person_id = form.pick;
    else payload.company_id = form.pick;
    const { error } = await supabase.from(table).update(payload).eq("id", rowId);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditingId(null);
    onChange();
  }

  async function remove(rowId) {
    if (!confirm("Remove this relationship?")) return;
    const { error } = await supabase.from(table).delete().eq("id", rowId);
    if (error) {
      alert(error.message);
      return;
    }
    onChange();
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        {!adding && (
          <button
            onClick={startAdd}
            className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-md border"
            style={{ borderColor: "var(--rule)" }}
          >
            <Plus size={12} /> Add
          </button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={submitAdd}
          className="rounded-md border p-3 mb-3 grid gap-2"
          style={{ borderColor: "var(--rule)", background: "var(--paper)", gridTemplateColumns: `repeat(${Math.min(fields.length + 1, 4)}, minmax(0,1fr))` }}
        >
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink-muted)" }}>
              {mode === "byCompany" ? "Person" : "Company"}
            </label>
            <select className={INPUT} style={{ borderColor: "var(--rule)" }} value={form.pick} onChange={(e) => setForm({ ...form, pick: e.target.value })}>
              <option value="">Choose…</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>{optionLabel(o)}</option>
              ))}
            </select>
          </div>
          {fields.map((fl) => (
            <FieldInput key={fl.key} field={fl} value={form[fl.key]} onChange={(v) => setForm({ ...form, [fl.key]: v })} />
          ))}
          <div className="flex items-end gap-2 col-span-full">
            {error && <span className="text-xs" style={{ color: "var(--red)" }}>{error}</span>}
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={cancel} className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-md border" style={{ borderColor: "var(--rule)" }}>
                <X size={12} /> Cancel
              </button>
              <button type="submit" disabled={saving} className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-md" style={{ background: "var(--accent)", color: "#fff" }}>
                <Save size={12} /> {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      )}

      {rows.length === 0 && !adding ? (
        <div className="text-sm italic" style={{ color: "var(--ink-muted)" }}>None on file.</div>
      ) : (
        rows.length > 0 && (
          <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--rule)" }}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: "var(--paper)" }}>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: "var(--ink-muted)" }}>
                    {mode === "byCompany" ? "Person" : "Company"}
                  </th>
                  {fields.map((fl) => (
                    <th key={fl.key} className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: "var(--ink-muted)" }}>{fl.label}</th>
                  ))}
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) =>
                  editingId === r.id ? (
                    <tr key={r.id} className="border-t" style={{ borderColor: "var(--rule-soft)" }}>
                      <td className="px-3 py-2">
                        <select className={INPUT} style={{ borderColor: "var(--rule)" }} value={form.pick} onChange={(e) => setForm({ ...form, pick: e.target.value })}>
                          {options.map((o) => (
                            <option key={o.id} value={o.id}>{optionLabel(o)}</option>
                          ))}
                        </select>
                      </td>
                      {fields.map((fl) => (
                        <td key={fl.key} className="px-3 py-2">
                          <FieldInput field={fl} value={form[fl.key]} onChange={(v) => setForm({ ...form, [fl.key]: v })} bare />
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={(e) => submitEdit(e, r.id)} disabled={saving} title="Save" className="p-1.5 rounded-md border" style={{ borderColor: "var(--rule)" }}>
                            <Save size={13} />
                          </button>
                          <button onClick={cancel} title="Cancel" className="p-1.5 rounded-md border" style={{ borderColor: "var(--rule)" }}>
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.id} className="ddt-row border-t" style={{ borderColor: "var(--rule-soft)" }}>
                      <td className="px-3 py-2">
                        {mode === "byCompany" ? (
                          <Link to={`/people/${r.person_id}`} style={{ color: "var(--accent)" }}>{r.people?.full_name || "—"}</Link>
                        ) : (
                          <Link to={`/companies/${r.company_id}`} style={{ color: "var(--accent)" }}>{r.companies_view?.name || "—"}</Link>
                        )}
                      </td>
                      {fields.map((fl) => (
                        <td key={fl.key} className="px-3 py-2">{displayValue(fl, r[fl.key])}</td>
                      ))}
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(r)} title="Edit" className="p-1.5 rounded-md border" style={{ borderColor: "var(--rule)" }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => remove(r.id)} title="Remove" className="p-1.5 rounded-md border" style={{ borderColor: "var(--rule)", color: "var(--red)" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

function displayValue(field, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "date") return new Date(value + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return value;
}

function FieldInput({ field, value, onChange, bare }) {
  const cls = INPUT;
  return (
    <div>
      {!bare && <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink-muted)" }}>{field.label}</label>}
      {field.type === "select" ? (
        <select className={cls} style={{ borderColor: "var(--rule)" }} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {field.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <input type="number" className={cls} style={{ borderColor: "var(--rule)" }} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === "date" ? (
        <input type="date" className={cls} style={{ borderColor: "var(--rule)" }} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" className={cls} style={{ borderColor: "var(--rule)" }} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
