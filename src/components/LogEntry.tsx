"use client";

import { useState } from "react";
import type { SavingsEntry } from "@/lib/firebase";

export default function LogEntry({
  entry,
  isMine,
  onSave,
  onDelete,
}: {
  entry: SavingsEntry;
  isMine: boolean;
  onSave: (amount: number, note: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(entry.amount));
  const [note, setNote] = useState(entry.note ?? "");
  const [busy, setBusy] = useState(false);

  if (editing) {
    return (
      <div className="w-full rounded-xl bg-black/5 dark:bg-white/10 px-3 py-2 flex flex-wrap gap-2 items-center transition-colors duration-300">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-24 shrink-0 rounded-full bg-white dark:bg-panel text-ink dark:text-bone px-3 py-1.5 text-base sm:text-xs outline-none focus:ring-2 focus:ring-accent transition-colors duration-300"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note"
          className="flex-1 min-w-[6rem] rounded-full bg-white dark:bg-panel text-ink dark:text-bone px-3 py-1.5 text-base sm:text-xs outline-none focus:ring-2 focus:ring-accent transition-colors duration-300"
        />
        <button
          disabled={busy}
          onClick={async () => {
            const value = Number(amount);
            if (!value || value <= 0) return;
            setBusy(true);
            await onSave(value, note.trim());
            setBusy(false);
            setEditing(false);
          }}
          className="text-xs font-medium text-accent px-2 shrink-0"
        >
          Save
        </button>
        <button onClick={() => setEditing(false)} className="text-xs text-slate dark:text-bone/60 px-1 shrink-0 transition-colors duration-300">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="w-full text-xs text-slate dark:text-bone/70 flex items-center justify-between gap-2 rounded-xl bg-black/5 dark:bg-white/10 px-3 py-2 transition-colors duration-300">
      <span className="min-w-0 break-words">
        {entry.displayName}
        {entry.note ? ` — ${entry.note}` : ""}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-medium text-ink dark:text-bone transition-colors duration-300">+₹{entry.amount.toLocaleString("en-IN")}</span>
        {isMine && (
          <>
            <button onClick={() => setEditing(true)} className="text-slate dark:text-bone/60 hover:text-ink dark:hover:text-bone px-1 transition-colors duration-300">
              Edit
            </button>
            <button
              onClick={async () => {
                if (confirm("Delete this entry?")) await onDelete();
              }}
              className="text-slate dark:text-bone/60 hover:text-ink dark:hover:text-bone px-1 transition-colors duration-300"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
