// Shared helpers for computing Due Date status (red/amber/green/overdue).
// Kept in one place so the tracker, company detail, and person pages all
// agree on the same rule: red = due within 1 month, amber = within 2
// months, green = everything else, overdue = past due_by.

export function parseISO(iso) {
  return new Date(iso + "T00:00:00");
}

export function fmtDate(iso) {
  if (!iso) return "—";
  return parseISO(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function statusOf(dueBy, today) {
  const diff = daysBetween(today, parseISO(dueBy));
  if (diff < 0) return "overdue";
  if (diff <= 30) return "red";
  if (diff <= 60) return "amber";
  return "green";
}

export function statusLabel(status, dueBy, today) {
  const diff = daysBetween(today, parseISO(dueBy));
  if (status === "overdue") return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} overdue`;
  if (diff === 0) return "Due today";
  return `Due in ${diff} day${diff === 1 ? "" : "s"}`;
}

export const STATUS_STYLE = {
  overdue: { dot: "var(--overdue)", bg: "var(--overdue-bg)", text: "var(--overdue)", label: "Overdue" },
  red: { dot: "var(--red)", bg: "var(--red-bg)", text: "var(--red)", label: "Within 1 month" },
  amber: { dot: "var(--amber)", bg: "var(--amber-bg)", text: "var(--amber)", label: "Within 2 months" },
  green: { dot: "var(--green)", bg: "var(--green-bg)", text: "var(--green)", label: "On track" },
};

export const TASK_TYPES = ["VAT", "Year-End Accounts", "Confirmation Statement", "Personal Tax"];
