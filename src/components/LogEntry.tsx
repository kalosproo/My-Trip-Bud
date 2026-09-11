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
      <div className="rounded-xl bg-black/5 px-3 py-2 flex gap-2 items-center">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-20 rounded-full bg-white px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note"
          className="flex-1 rounded-full bg-white px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-accent"
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
          className="text-xs font-medium text-accent px-2"
        >
          Save
        </button>
        <button onClick={() => setEditing(false)} className="text-xs text-slate px-1">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="text-xs text-slate flex items-center justify-between rounded-xl bg-black/5 px-3 py-2">
      <span>
        {entry.displayName}
        {entry.note ? ` — ${entry.note}` : ""}
      </span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-ink">+₹{entry.amount.toLocaleString("en-IN")}</span>
        {isMine && (
          <>
            <button onClick={() => setEditing(true)} className="text-slate hover:text-ink px-1">
              Edit
            </button>
            <button
              onClick={async () => {
                if (confirm("Delete this entry?")) await onDelete();
              }}
              className="text-slate hover:text-ink px-1"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}