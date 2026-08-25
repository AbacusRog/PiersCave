import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { fmtDate } from "../lib/dueDates";

export default function PersonDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [pscs, setPscs] = useState([]);
  const [shareholders, setShareholders] = useState([]);

  useEffect(() => {
    async function load() {
      const [p, o, ps, sh] = await Promise.all([
        supabase.from("people").select("*").eq("id", id).single(),
        supabase.from("company_officers").select("*, companies_view(id, name)").eq("person_id", id),
        supabase.from("company_pscs").select("*, companies_view(id, name)").eq("person_id", id),
        supabase.from("company_shareholders").select("*, companies_view(id, name)").eq("person_id", id),
      ]);
      setPerson(p.data);
      setOfficers(o.data || []);
      setPscs(ps.data || []);
      setShareholders(sh.data || []);
    }
    load();
  }, [id]);

  if (!person) return <div className="p-8 text-sm" style={{ color: "var(--ink-muted)" }}>Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 md:px-8">
      <Link to="/people" className="text-xs font-medium" style={{ color: "var(--accent)" }}>← All people</Link>

      <h1 className="ddt-serif text-3xl font-semibold mt-3 mb-1">{person.full_name}</h1>
      <div className="text-sm mb-6 flex flex-wrap gap-x-4 gap-y-1" style={{ color: "var(--ink-muted)" }}>
        {person.dob_month_year && <span>Born {person.dob_month_year}</span>}
        {person.nationality && <span>{person.nationality}</span>}
        {person.occupation && <span>{person.occupation}</span>}
      </div>

      <Section title="Companies (as director / secretary)">
        {officers.length === 0 ? (
          <Empty />
        ) : (
          officers.map((o) => (
            <CompanyRow key={o.id} co={o.companies_view} sub={`${o.role} · appointed ${fmtDate(o.appointed_on)}${o.status === "Resigned" ? " · resigned" : ""}`} />
          ))
        )}
      </Section>

      <Section title="Persons with significant control">
        {pscs.length === 0 ? (
          <Empty />
        ) : (
          pscs.map((p) => <CompanyRow key={p.id} co={p.companies_view} sub={p.nature_of_control} />)
        )}
      </Section>

      <Section title="Shareholdings">
        {shareholders.length === 0 ? (
          <Empty />
        ) : (
          shareholders.map((s) => (
            <CompanyRow key={s.id} co={s.companies_view} sub={`${s.shares_held ?? "—"} ${s.share_class} shares`} />
          ))
        )}
      </Section>

      {person.notes && (
        <p className="text-xs italic mt-6" style={{ color: "var(--ink-muted)" }}>{person.notes}</p>
      )}
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
