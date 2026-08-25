// Simple bipartite relationship map: people on the left, companies on the
// right, lines drawn between them for every officer/PSC/shareholder link.
// Mirrors the bipartite SVG map built for the IFK Register.
export default function RelationshipGraph({ people, companies, links }) {
  const rowH = 56;
  const width = 720;
  const leftX = 160;
  const rightX = width - 160;
  const topPad = 30;

  const peopleY = Object.fromEntries(people.map((p, i) => [p.id, topPad + i * rowH]));
  const companiesY = Object.fromEntries(companies.map((c, i) => [c.id, topPad + i * rowH]));

  const height = Math.max(people.length, companies.length) * rowH + topPad * 2;

  const roleColor = { Director: "#0B5563", PSC: "#9C6B14", Shareholder: "#6B4C7A" };

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} style={{ minWidth: width }}>
        {links.map((l, i) => {
          const y1 = peopleY[l.personId];
          const y2 = companiesY[l.companyId];
          if (y1 === undefined || y2 === undefined) return null;
          const midX = width / 2;
          return (
            <path
              key={i}
              d={`M ${leftX + 6} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${rightX - 6} ${y2}`}
              fill="none"
              stroke={roleColor[l.role] || "#999"}
              strokeWidth={1.5}
              opacity={0.55}
            />
          );
        })}

        {people.map((p) => (
          <g key={p.id} transform={`translate(0, ${peopleY[p.id]})`}>
            <circle cx={leftX} cy={0} r={5} fill="#16242E" />
            <text x={leftX - 14} y={4} textAnchor="end" fontSize={12} fontFamily="Inter, sans-serif" fill="#16242E">
              {p.full_name}
            </text>
          </g>
        ))}

        {companies.map((c) => (
          <g key={c.id} transform={`translate(0, ${companiesY[c.id]})`}>
            <circle cx={rightX} cy={0} r={5} fill="#0B5563" />
            <text x={rightX + 14} y={4} fontSize={12} fontFamily="Inter, sans-serif" fill="#16242E">
              {c.name}
            </text>
          </g>
        ))}
      </svg>

      <div className="flex gap-4 mt-3 text-xs" style={{ color: "var(--ink-muted)" }}>
        {Object.entries(roleColor).map(([role, color]) => (
          <span key={role} className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 2, background: color, display: "inline-block" }} />
            {role}
          </span>
        ))}
      </div>
    </div>
  );
}
