"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { watchUserTrips, type Trip } from "@/lib/firebase";
import { useAuth, SignInPrompt } from "@/components/AuthProvider";
import { errorMessage } from "@/lib/errors";

export default function Home() {
  const { user, loading } = useAuth();
  const [result, setResult] = useState<{ uid: string; trips: Trip[]; error: string } | null>(null);
  useEffect(() => {
    setResult(null);
    if (!user) return;
    return watchUserTrips(user.uid,
      (trips) => setResult({ uid: user.uid, trips, error: "" }),
      (failure) => setResult({ uid: user.uid, trips: [], error: errorMessage(failure) }));
  }, [user]);

  if (loading) return <p role="status" className="text-center py-24">Loading your account…</p>;
  if (!user) return <SignInPrompt />;
  const current = result?.uid === user.uid ? result : null;
  return <main className="max-w-lg mx-auto px-4 py-8 space-y-8">
    <section>
      <p className="text-xs uppercase tracking-widest text-slate dark:text-bone/60 mb-3">Your travel fund</p>
      <h1 className="font-display text-4xl leading-tight">What are we planning?</h1>
      <p className="mt-4 text-sm text-slate dark:text-bone/70">All the trips you created or joined, together in one place.</p>
    </section>
    <Link href="/create" className="block rounded-2xl bg-ink dark:bg-bone text-bone dark:text-ink p-5 font-medium">+ Create a trip</Link>
    <section aria-label="Your trips" className="space-y-3">
      <h2 className="font-display text-2xl">Your trips</h2>
      {!current && <p role="status">Loading your trips…</p>}
      {current?.error && <p role="alert" className="text-red-700 dark:text-red-300">{current.error}</p>}
      {current && !current.error && current.trips.length === 0 && <p className="text-sm text-slate dark:text-bone/70">No trips yet. Create a fund or open a friend’s invite link.</p>}
      {current?.trips.map((trip) => <Link key={trip.id} href={`/trip/${trip.id}`} className="block rounded-3xl bg-white dark:bg-panel p-5 ring-1 ring-black/5 dark:ring-white/10 shadow-soft transition-transform hover:-translate-y-0.5">
        <span className="font-medium break-words">{trip.name}</span>
        <span className="block mt-1 text-sm text-slate dark:text-bone/70">{trip.mode === "team" ? "With friends" : "Just me"} · ₹{trip.goalAmount.toLocaleString("en-IN")} goal</span>
      </Link>)}
    </section>
  </main>;
}
