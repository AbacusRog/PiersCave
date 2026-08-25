import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import RelationshipGraph from "../components/RelationshipGraph";

export default function People() {
  const [people, setPeople] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 md:px-8">
      <div className="flex flex-col gap-1 border-b pb-6 mb-6" style={{ borderColor: "var(--rule)" }}>
        <span className="text-xs tracking-widest uppercase font-semibold" style={{ color: "var(--accent)", letterSpacing: "0.14em" }}>
          Company Register
        </span>
        <h1 className="ddt-serif text-3xl font-semibold">People</h1>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>Directors, PSCs, and shareholders across every company in the register.</p>
      </div>

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
