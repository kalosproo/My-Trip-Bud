"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { watchAuth, createTrip, type User } from "@/lib/firebase";

export default function CreateTrip() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => watchAuth(setUser), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim() || !Number(goal)) return;
    setBusy(true);
    const tripId = await createTrip(name.trim(), Number(goal), user);
    router.push(`/trip/${tripId}`);
  }

  if (!user) {
    return <p className="text-center py-24 text-slate text-sm">Sign in first from the home page.</p>;
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 py-24">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-[2rem] bg-black/5 p-2 ring-1 ring-black/5"
      >
        <div className="rounded-[calc(2rem-0.5rem)] bg-white shadow-inset-soft p-6 flex flex-col gap-4">
          <h1 className="font-display text-2xl text-ink">New trip fund</h1>
          <input
            type="text"
            placeholder="Trip name (e.g. Goa 2027)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-full bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            required
          />
          <input
            type="number"
            min="1"
            placeholder="₹ total goal amount"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="rounded-full bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-bone transition-transform duration-300 ease-fluid active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create fund"}
          </button>
        </div>
      </form>
    </main>
  );
}
