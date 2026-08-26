import { useState } from "react";
import { Plus, X, Save } from "lucide-react";
import { supabase } from "../supabaseClient";
import { computeDueBy } from "../lib/dueDates";

const INPUT = "text-xs px-2 py-1.5 rounded-md border w-full";

// Inline "Add due date" form for a company's or person's due_dates.
// There's no prior row to advance from for a brand-new company/task, so
// Due By is computed straight from Due Date using the same offset rules
// the recurrence engine uses, then left editable in case it needs a
// manual override (e.g. an extended filing deadline).
export default function AddDueDateForm({ companyId, personId, taskTypes, onAdded }) {
  const [open, setOpen] = useState(false);
  const [taskType, setTaskType] = useState(taskTypes[0]);
  const [dueDate, setDueDate] = useState("");
  const [dueBy, setDueBy] = useState("");
  const [dueByTouched, setDueByTouched] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [flag, setFlag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setTaskType(taskTypes[0]);
    setDueDate("");
    setDueBy("");
    setDueByTouched(false);
    setAmount("");
    setNote("");
    setFlag("");
    setError("");
  }

  function handleDueDateChange(v) {
    setDueDate(v);
    if (!dueByTouched) setDueBy(computeDueBy(taskType, v));
  }

  function handleTaskTypeChange(v) {
    setTaskType(v);
    if (!dueByTouched && dueDate) setDueBy(computeDueBy(v, dueDate));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!dueDate || !dueBy) {
      setError("Due Date and Due By are both required.");
      return;
    }
    setSaving(true);
    const payload = {
      company_id: companyId || null,
      person_id: personId || null,
      task_type: taskType,
      due_date: dueDate,
      due_by: dueBy,
      amount: amount || null,
      note: note || null,
      flag: flag || null,
      filed: false,
    };
    const { error } = await supabase.from("due_dates").insert(payload);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    reset();
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-md border"
          style={{ borderColor: "var(--rule)" }}
        >
          <Plus size={12} /> Add due date
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-md border p-3 mb-3 grid gap-2"
      style={{ borderColor: "var(--rule)", background: "var(--paper)", gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}
    >
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink-muted)" }}>Task</label>
        <select className={INPUT} style={{ borderColor: "var(--rule)" }} value={taskType} onChange={(e) => handleTaskTypeChange(e.target.value)}>
          {taskTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink-muted)" }}>Due Date</label>
        <input type="date" required className={INPUT} style={{ borderColor: "var(--rule)" }} value={dueDate} onChange={(e) => handleDueDateChange(e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink-muted)" }}>Due By</label>
        <input
          type="date"
          required
          className={INPUT}
          style={{ borderColor: "var(--rule)" }}
          value={dueBy}
          onChange={(e) => {
            setDueBy(e.target.value);
            setDueByTouched(true);
          }}
        />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink-muted)" }}>Amount (optional)</label>
        <input className={INPUT} style={{ borderColor: "var(--rule)" }} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. £2,706.63" />
      </div>
      <div className="col-span-2">
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink-muted)" }}>Note (optional)</label>
        <input className={INPUT} style={{ borderColor: "var(--rule)" }} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="col-span-2">
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink-muted)" }}>Flag (optional warning)</label>
        <input className={INPUT} style={{ borderColor: "var(--rule)" }} value={flag} onChange={(e) => setFlag(e.target.value)} />
      </div>

      <div className="flex items-end gap-2 col-span-full">
        {error && <span className="text-xs" style={{ color: "var(--red)" }}>{error}</span>}
        <div className="flex gap-2 ml-auto">
          <button type="button" onClick={() => { reset(); setOpen(false); }} className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-md border" style={{ borderColor: "var(--rule)" }}>
            <X size={12} /> Cancel
          </button>
          <button type="submit" disabled={saving} className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-md" style={{ background: "var(--accent)", color: "#fff" }}>
            <Save size={12} /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
