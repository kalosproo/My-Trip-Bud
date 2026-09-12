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
import TripIllustration from "@/components/TripIllustration";
import Celebration from "@/components/Celebration";

export default function TripDashboard({ params }: { params: { tripId: string } }) {
  const { tripId } = params;
  const [user, setUser] = useState<User | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [log, setLog] = useState<SavingsEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const prevPercentRef = useRef(0);

  async function copyInviteLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  useEffect(() => watchAuth(setUser), []);
  useEffect(() => watchTrip(tripId, setTrip), [tripId]);
  useEffect(() => watchSavingsLog(tripId, setLog), [tripId]);

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

  const members = trip ? Object.values(trip.members) : [];
  const share = trip && members.length ? trip.goalAmount / members.length : trip?.goalAmount ?? 0;
  const totalSaved = members.reduce((sum, m) => sum + m.totalSaved, 0);
  const percent = trip && trip.goalAmount > 0 ? (totalSaved / trip.goalAmount) * 100 : 0;

  // fire the celebration overlay once, the moment the fund crosses 100%
  useEffect(() => {
    if (prevPercentRef.current < 100 && percent >= 100) setCelebrate(true);
    prevPercentRef.current = percent;
  }, [percent]);

  if (!user) {
    return (
      <main className="min-h-[100dvh] w-full flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate dark:text-bone/60 text-sm transition-colors duration-300">Sign in to view this trip.</p>
        <button
          onClick={() => signInWithGoogle()}
          className="rounded-full bg-ink dark:bg-bone px-6 py-3 text-sm font-medium text-bone dark:text-ink transition-colors duration-300"
        >
          Continue with Google
        </button>
      </main>
    );
  }

  if (!trip) {
    return <p className="text-center py-24 text-slate dark:text-bone/60 text-sm px-4 transition-colors duration-300">Loading trip…</p>;
  }

  const me = trip.members[user.uid];

  return (
    <>
      <main className="min-h-[100dvh] w-full px-4 pt-20 pb-28 sm:pb-24 max-w-lg mx-auto flex flex-col gap-5 sm:gap-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-black/5 dark:bg-white/10 text-slate dark:text-bone/70 mb-3 transition-colors duration-300">
              {trip.mode === "individual" ? "Solo fund" : "Trip fund"}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-bone break-words transition-colors duration-300">
              {trip.name}
            </h1>
            <p className="text-slate dark:text-bone/70 text-sm mt-1 transition-colors duration-300">
              {trip.mode === "team" ? `${members.length} friend${members.length === 1 ? "" : "s"} · ` : ""}
              1 goal · ₹{trip.goalAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <TripIllustration className="w-16 h-12 text-ink/60 dark:text-bone/40 shrink-0 hidden sm:block" />
        </header>

        {trip.mode === "team" && (
          <button
            onClick={copyInviteLink}
            className="self-start -mt-2 shrink-0 rounded-full bg-black/5 dark:bg-white/10 px-4 py-2.5 sm:py-2 text-xs font-medium text-ink dark:text-bone transition-all duration-300 ease-fluid active:scale-[0.98]"
          >
            {copied ? "Copied ✓" : "Copy invite link"}
          </button>
        )}

        <ProgressBar percent={percent} raised={totalSaved} goal={trip.goalAmount} />

        {me && (
          <AddSavingsForm
            onAdd={(amount, note) => addSavingsEntry(tripId, user, amount, note, me.totalSaved)}
          />
        )}

        {trip.mode === "team" && (
          <section id="members">
            <h2 className="text-xs uppercase tracking-[0.15em] text-slate dark:text-bone/60 mb-2 transition-colors duration-300">
              Who&apos;s saved what
            </h2>
            <div ref={listRef} className="flex flex-col gap-2">
              {members.map((m) => (
                <MemberCard key={m.uid} member={m} share={share} />
              ))}
            </div>
          </section>
        )}

        <section id="log">
          <h2 className="text-xs uppercase tracking-[0.15em] text-slate dark:text-bone/60 mb-2 transition-colors duration-300">Log</h2>
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
            {log.length === 0 && (
              <p className="text-xs text-slate dark:text-bone/60 transition-colors duration-300">No entries yet — be the first.</p>
            )}
          </div>
        </section>
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 z-20 bg-white/90 dark:bg-panel/90 backdrop-blur border-t border-black/5 dark:border-white/10 transition-colors duration-300"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-around px-4 py-2.5">
          <a href="/" className="flex flex-col items-center gap-1 text-ink dark:text-bone">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 11l8-7 8 7M6 10v9h12v-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px]">Home</span>
          </a>
          {trip.mode === "team" && (
            
              href="#members"
              className="flex flex-col items-center gap-1 text-slate dark:text-bone/60 hover:text-ink dark:hover:text-bone transition-colors duration-300"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3 20c0-3 3-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                <path d="M15 14c2.8.3 5 2 5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="text-[10px]">Members</span>
            </a>
          )}
          
            href="#log"
            className="flex flex-col items-center gap-1 text-slate dark:text-bone/60 hover:text-ink dark:hover:text-bone transition-colors duration-300"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 6h14M5 12h14M5 18h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="text-[10px]">Log</span>
          </a>
        </div>
      </nav>

      {celebrate && (
        <Celebration
          message={`₹${trip.goalAmount.toLocaleString("en-IN")} reached!`}
          onClose={() => setCelebrate(false)}
        />
      )}
    </>
  );
}
