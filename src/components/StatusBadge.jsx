import { STATUS_STYLE, statusLabel } from "../lib/dueDates";

export default function StatusBadge({ status, dueBy, today }) {
  const st = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
      style={{ background: st.bg, color: st.text }}
    >
      <span className="inline-block rounded-full" style={{ width: 7, height: 7, background: st.dot }} />
      {statusLabel(status, dueBy, today)}
    </span>
  );
}
