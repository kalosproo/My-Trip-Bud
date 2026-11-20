"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/errors";
import { validateAmount } from "@/lib/money";

export default function AddSavingsForm({
  onAdd,
}: {
  onAdd: (amount: number, note: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      validateAmount(value);
      await onAdd(value, note.trim());
      setAmount(""); setNote("");
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full rounded-2xl bg-white dark:bg-panel ring-1 ring-black/5 dark:ring-white/10 shadow-soft dark:shadow-soft-dark p-4 flex flex-col sm:flex-row sm:flex-wrap gap-3 transition-colors duration-300"
    >
      <input
        type="number"
        min="1"
        max="1000000000"
        step="1"
        aria-label="Amount saved in rupees"
        inputMode="decimal"
        placeholder="₹ amount saved"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full sm:w-32 shrink-0 rounded-full bg-black/5 dark:bg-white/10 px-4 py-2.5 sm:py-2 text-base sm:text-sm text-ink dark:text-bone outline-none focus:ring-2 focus:ring-accent transition-colors duration-300"
        required
      />
      <input
        type="text"
        aria-label="Savings note"
        maxLength={500}
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
      {error && <p role="alert" className="basis-full text-sm text-red-700 dark:text-red-300">{error}</p>}
    </form>
  );
}
