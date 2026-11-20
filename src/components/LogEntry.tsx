"use client";

import { useState } from "react";
import type { SavingsEntry } from "@/lib/firebase";
import { errorMessage } from "@/lib/errors";
import { validateAmount } from "@/lib/money";

export default function LogEntry({ entry, isMine, onSave, onDelete }: {
  entry: SavingsEntry; isMine: boolean;
  onSave: (amount: number, note: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(entry.amount));
  const [note, setNote] = useState(entry.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try { validateAmount(Number(amount)); await onSave(Number(amount), note.trim()); setEditing(false); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (busy || !confirm("Delete this entry?")) return;
    setBusy(true); setError("");
    try { await onDelete(); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  const inputClass = "rounded-full bg-white dark:bg-panel px-3 py-2 text-sm min-w-0 focus:ring-2 focus:ring-accent";
  return <div className="rounded-xl bg-black/5 dark:bg-white/10 px-3 py-3 space-y-2">
    {editing ? <form onSubmit={save} className="flex flex-wrap gap-2 items-center">
      <input aria-label="Edit amount in rupees" type="number" min="1" max="1000000000" step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} className={`${inputClass} w-28`} />
      <input aria-label="Edit savings note" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className={`${inputClass} flex-1`} />
      <button disabled={busy} className="text-sm text-accent disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
      <button type="button" disabled={busy} onClick={() => { setEditing(false); setError(""); }} className="text-sm">Cancel</button>
    </form> : <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <span className="min-w-0 break-words">{entry.displayName}{entry.note ? ` — ${entry.note}` : ""}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-medium">+₹{entry.amount.toLocaleString("en-IN")}</span>
        {isMine && <>
          <button disabled={busy} onClick={() => { setAmount(String(entry.amount)); setNote(entry.note ?? ""); setError(""); setEditing(true); }} className="p-1">Edit</button>
          <button disabled={busy} onClick={remove} className="p-1 disabled:opacity-50">{busy ? "Deleting…" : "Delete"}</button>
        </>}
      </div>
    </div>}
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
  </div>;
}
