"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTrip } from "@/lib/firebase";
import { useAuth, SignInPrompt } from "@/components/AuthProvider";
import { errorMessage } from "@/lib/errors";

export default function CreateTrip() {
  const { user, loading } = useAuth();
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [mode, setMode] = useState<"individual" | "team">("team");
  const [busy, setBusy] = useState(false);
  const router = useRouter();



  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    setBusy(true);
    setError("");
    try {
      const tripId = await createTrip(name.trim(), Number(goal), user, mode);
      router.push(`/trip/${tripId}`);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }

  if (loading) return <p role="status" className="text-center py-24">Loading your account…</p>;
  if (!user) return <SignInPrompt />;

  return (
    <main className="min-h-[100dvh] w-full flex items-center justify-center px-4 py-16 sm:py-24">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-[2rem] bg-black/5 dark:bg-white/10 p-2 ring-1 ring-black/5 dark:ring-white/10 transition-colors duration-300"
      >
        <div className="rounded-[calc(2rem-0.5rem)] bg-white dark:bg-panel shadow-inset-soft dark:shadow-inset-soft-dark p-5 sm:p-6 flex flex-col gap-4 transition-colors duration-300">
          <h1 className="font-display text-2xl text-ink dark:text-bone transition-colors duration-300">New trip fund</h1>

          <div className="flex gap-2 rounded-full bg-black/5 dark:bg-white/10 p-1 transition-colors duration-300">
            <button
              type="button"
              aria-pressed={mode === "individual"}
              onClick={() => setMode("individual")}
              className={`flex-1 rounded-full py-2.5 sm:py-2 text-xs font-medium transition-colors duration-300 ease-fluid ${
                mode === "individual" ? "bg-ink dark:bg-bone text-bone dark:text-ink" : "text-slate dark:text-bone/60"
              }`}
            >
              Just me
            </button>
            <button
              type="button"
              aria-pressed={mode === "team"}
              onClick={() => setMode("team")}
              className={`flex-1 rounded-full py-2.5 sm:py-2 text-xs font-medium transition-colors duration-300 ease-fluid ${
                mode === "team" ? "bg-ink dark:bg-bone text-bone dark:text-ink" : "text-slate dark:text-bone/60"
              }`}
            >
              With friends
            </button>
          </div>
          <p className="text-xs text-slate dark:text-bone/60 -mt-2 transition-colors duration-300">
            {mode === "individual"
              ? "A private fund just for you — no invite link."
              : "You'll get a link to invite friends after this."}
          </p>

          <input
            type="text"
            aria-label="Trip name"
            maxLength={120}
            placeholder="Trip name (e.g. Goa 2027)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-full bg-black/5 dark:bg-white/10 px-4 py-3 text-base sm:text-sm text-ink dark:text-bone outline-none focus:ring-2 focus:ring-accent transition-colors duration-300"
            required
          />
          <input
            type="number"
            min="1"
            max="1000000000"
            step="1"
            aria-label="Goal amount in rupees"
            inputMode="decimal"
            placeholder="₹ total goal amount"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full rounded-full bg-black/5 dark:bg-white/10 px-4 py-3 text-base sm:text-sm text-ink dark:text-bone outline-none focus:ring-2 focus:ring-accent transition-colors duration-300"
            required
          />
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-ink dark:bg-bone px-6 py-3.5 sm:py-3 text-sm font-medium text-bone dark:text-ink transition-all duration-300 ease-fluid active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create fund"}
          </button>
        </div>
      </form>
    </main>
  );
}
