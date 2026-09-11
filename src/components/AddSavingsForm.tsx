"use client";

import { useState } from "react";

export default function AddSavingsForm({
  onAdd,
}: {
  onAdd: (amount: number, note: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    setBusy(true);
    await onAdd(value, note.trim());
    setAmount("");
    setNote("");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white ring-1 ring-black/5 shadow-soft p-4 flex gap-3">
      <input
        type="number"
        min="1"
        inputMode="decimal"
        placeholder="₹ amount saved"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-32 rounded-full bg-black/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        required
      />
      <input
        type="text"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="flex-1 rounded-full bg-black/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-bone transition-transform duration-300 ease-fluid active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
