"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import {
  watchAuth,
  watchTrip,
  watchSavingsLog,
  joinTrip,
  addSavingsEntry,
  updateSavingsEntry,
  deleteSavingsEntry,
  signInWithGoogle,
  type User,
  type Trip,
  type SavingsEntry,
} from "@/lib/firebase";
import ProgressBar from "@/components/ProgressBar";
import MemberCard from "@/components/MemberCard";
import AddSavingsForm from "@/components/AddSavingsForm";
import LogEntry from "@/components/LogEntry";

export default function TripDashboard({ params }: { params: { tripId: string } }) {
  const { tripId } = params;
  const [user, setUser] = useState<User | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [log, setLog] = useState<SavingsEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function copyInviteLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  useEffect(() => watchAuth(setUser), []);
  useEffect(() => watchTrip(tripId, setTrip), [tripId]);
  useEffect(() => watchSavingsLog(tripId, setLog), [tripId]);

  // auto-join: any signed-in friend opening a team link becomes a member.
  // individual funds are private — no one auto-joins those.
  useEffect(() => {
    if (user && trip && trip.mode === "team" && !trip.memberUids.includes(user.uid)) {
      joinTrip(tripId, user);
    }
  }, [user, trip, tripId]);

  useEffect(() => {
    if (!listRef.current) return;
    anime({
      targets: listRef.current.children,
      translateY: [16, 0],
      opacity: [0, 1],
      delay: anime.stagger(60),
      duration: 500,
      easing: "cubicBezier(.32,.72,0,1)",
    });
  }, [trip?.memberUids.length]);

  if (!user) {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate text-sm">Sign in to view this trip.</p>
        <button
          onClick={() => signInWithGoogle()}
          className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-bone"
        >
          Continue with Google
        </button>
      </main>
    );
  }
  if (!trip) return <p className="text-center py-24 text-slate text-sm">Loading trip…</p>;

  const members = Object.values(trip.members);
  const share = members.length ? trip.goalAmount / members.length : trip.goalAmount;
  const totalSaved = members.reduce((sum, m) => sum + m.totalSaved, 0);
  const percent = trip.goalAmount > 0 ? (totalSaved / trip.goalAmount) * 100 : 0;
  const me = trip.members[user.uid];

  return (
    <main className="min-h-[100dvh] px-4 py-16 max-w-lg mx-auto flex flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-black/5 text-slate mb-3">
            {trip.mode === "individual" ? "Solo fund" : "Trip fund"}
          </span>
          <h1 className="font-display text-3xl text-ink">{trip.name}</h1>
          <p className="text-slate text-sm mt-1">
            Goal ₹{trip.goalAmount.toLocaleString("en-IN")}
            {trip.mode === "team" ? ` · split ₹${share.toLocaleString("en-IN")} each` : ""}
          </p>
        </div>
        {trip.mode === "team" && (
          <button
            onClick={copyInviteLink}
            className="shrink-0 rounded-full bg-black/5 px-4 py-2 text-xs font-medium text-ink transition-transform duration-300 ease-fluid active:scale-[0.98]"
          >
            {copied ? "Copied ✓" : "Copy invite link"}
          </button>
        )}
      </header>

      <ProgressBar percent={percent} />

      {me && (
        <AddSavingsForm
          onAdd={(amount, note) => addSavingsEntry(tripId, user, amount, note, me.totalSaved)}
        />
      )}

      {trip.mode === "team" && (
        <section>
          <h2 className="text-xs uppercase tracking-[0.15em] text-slate mb-2">Who&apos;s saved what</h2>
          <div ref={listRef} className="flex flex-col gap-2">
            {members.map((m) => (
              <MemberCard key={m.uid} member={m} share={share} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs uppercase tracking-[0.15em] text-slate mb-2">Log</h2>
        <div className="flex flex-col gap-1.5">
          {log.map((entry) => (
            <LogEntry
              key={entry.id}
              entry={entry}
              isMine={entry.uid === user.uid}
              onSave={(amount, note) =>
                updateSavingsEntry(tripId, entry.id, entry.uid, entry.amount, amount, note, me.totalSaved)
              }
              onDelete={() => deleteSavingsEntry(tripId, entry.id, entry.uid, entry.amount, me.totalSaved)}
            />
          ))}
          {log.length === 0 && <p className="text-xs text-slate">No entries yet — be the first.</p>}
        </div>
      </section>
    </main>
  );
}