// Shared helpers for computing Due Date status, the rolling 24-month
// display window, and generating the next occurrence of a recurring task
// when one is marked done.

export function parseISO(iso) {
  return new Date(iso + "T00:00:00");
}

export function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

/* ---------------------------------------------------------------
   24-month rolling display window
--------------------------------------------------------------- */
export const WINDOW_MONTHS = 24;

export function windowEnd(today) {
  return addMonthsPreserveEom(toISO(today), WINDOW_MONTHS);
}

export function withinWindow(dueByISO, today) {
  return dueByISO <= toISO(windowEnd(today));
}

/* ---------------------------------------------------------------
   Month arithmetic that preserves "end of month" — needed because
   period-end dates (VAT quarters, year ends) must stay at month-end
   when rolled forward, not slide around like a naive setMonth() would.
--------------------------------------------------------------- */
export function addMonthsPreserveEom(iso, n) {
  const d = parseISO(iso);
  const day = d.getDate();
  const lastDayOfCurrentMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const wasEndOfMonth = day === lastDayOfCurrentMonth;

  const targetYear = d.getFullYear();
  const targetMonthIndex = d.getMonth() + n;
  const lastDayOfTargetMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
  const newDay = wasEndOfMonth ? lastDayOfTargetMonth : Math.min(day, lastDayOfTargetMonth);

  return new Date(targetYear, targetMonthIndex, newDay);
}

export function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return d;
}

/* ---------------------------------------------------------------
   Compute Due By directly from a Due Date for a fresh occurrence
   (used by the "Add due date" form — there's no prior row to advance
   from yet, so this applies the same offset rules directly).
--------------------------------------------------------------- */
export function computeDueBy(taskType, dueDateISO) {
  if (!dueDateISO) return "";
  if (taskType === "VAT") return toISO(addDays(toISO(addMonthsPreserveEom(dueDateISO, 1)), 7));
  if (taskType === "Confirmation Statement") return toISO(addDays(dueDateISO, 14));
  if (taskType === "Year-End Accounts") return toISO(addMonthsPreserveEom(dueDateISO, 9));
  return dueDateISO; // Personal Tax (and anything else) — due_by is the payment date itself
}

/* ---------------------------------------------------------------
   Recurrence rules per task type, and the note auto-generated for
   the next Personal Tax occurrence (alternates 31 Jan / 31 Jul).
--------------------------------------------------------------- */
function taxYearLabel(aprilEndYear) {
  return `${aprilEndYear - 1}-${String(aprilEndYear).slice(-2)}`;
}

function personalTaxNote(dueDateISO) {
  const d = parseISO(dueDateISO);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  if (month === 1) {
    return `${taxYearLabel(year - 1)} balancing payment + ${taxYearLabel(year)} 1st payment on account`;
  }
  return `${taxYearLabel(year)} 2nd payment on account`;
}

export function getNextOccurrence(row) {
  let nextDueDate, nextDueBy, amount = null, note = null;

  if (row.task_type === "VAT") {
    nextDueDate = addMonthsPreserveEom(row.due_date, 3);
    nextDueBy = addDays(toISO(addMonthsPreserveEom(toISO(nextDueDate), 1)), 7);
  } else if (row.task_type === "Confirmation Statement") {
    nextDueDate = addMonthsPreserveEom(row.due_date, 12);
    nextDueBy = addDays(toISO(nextDueDate), 14);
  } else if (row.task_type === "Year-End Accounts") {
    nextDueDate = addMonthsPreserveEom(row.due_date, 12);
    nextDueBy = addMonthsPreserveEom(toISO(nextDueDate), 9);
  } else if (row.task_type === "Personal Tax") {
    nextDueDate = addMonthsPreserveEom(row.due_date, 6);
    nextDueBy = nextDueDate;
    amount = "TBC";
    note = personalTaxNote(toISO(nextDueDate));
  } else {
    throw new Error("Unknown task_type: " + row.task_type);
  }

  return {
    company_id: row.company_id,
    person_id: row.person_id,
    task_type: row.task_type,
    due_date: toISO(nextDueDate),
    due_by: toISO(nextDueBy),
    amount,
    note,
    flag: null,
    filed: false,
  };
}

/**
 * Marks a due_dates row as filed and inserts the next occurrence in one
 * go. Returns { error } — error is null on success.
 */
export async function markDoneAndAdvance(supabase, row) {
  const { error: updateError } = await supabase.from("due_dates").update({ filed: true }).eq("id", row.id);
  if (updateError) return { error: updateError };

  const next = getNextOccurrence(row);
  const { error: insertError } = await supabase.from("due_dates").insert(next);
  if (insertError) return { error: insertError };

  return { error: null };
}
