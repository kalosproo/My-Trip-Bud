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
    <form
      onSubmit={submit}
      className="w-full rounded-2xl bg-white dark:bg-panel ring-1 ring-black/5 dark:ring-white/10 shadow-soft dark:shadow-soft-dark p-4 flex flex-col sm:flex-row gap-3 transition-colors duration-300"
    >
      <input
        type="number"
        min="1"
        inputMode="decimal"
        placeholder="₹ amount saved"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full sm:w-32 shrink-0 rounded-full bg-black/5 dark:bg-white/10 px-4 py-2.5 sm:py-2 text-base sm:text-sm text-ink dark:text-bone outline-none focus:ring-2 focus:ring-accent transition-colors duration-300"
        required
      />
      <input
        type="text"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full flex-1 min-w-0 rounded-full bg-black/5 dark:bg-white/10 px-4 py-2.5 sm:py-2 text-base sm:text-sm text-ink dark:text-bone outline-none focus:ring-2 focus:ring-accent transition-colors duration-300"
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full sm:w-auto shrink-0 rounded-full bg-ink dark:bg-bone px-5 py-2.5 sm:py-2 text-sm font-medium text-bone dark:text-ink transition-all duration-300 ease-fluid active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
