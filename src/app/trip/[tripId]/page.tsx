"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import Link from "next/link";
import { useAuth, SignInPrompt } from "@/components/AuthProvider";
import { errorMessage } from "@/lib/errors";
import { splitGoal } from "@/lib/money";
import { useGoalCelebration } from "@/lib/useGoalCelebration";
import {
  watchTrip,
  watchSavingsLog,
  joinTrip,
  addSavingsEntry,
  updateSavingsEntry,
  deleteSavingsEntry,
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
  const { user, loading } = useAuth();
  if (loading) return <p role="status" className="text-center py-24">Loading your account…</p>;
  if (!user) return <SignInPrompt />;
  return <TripView key={`${params.tripId}:${user.uid}`} tripId={params.tripId} user={user} />;
}

function TripView({ tripId, user }: { tripId: string; user: User }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [log, setLog] = useState<SavingsEntry[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const [logError, setLogError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [retry, setRetry] = useState(0);
  const [shareStatus, setShareStatus] = useState("");
  const [manualLink, setManualLink] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const isMember = !!trip?.memberUids.includes(user.uid);

  async function copyInviteLink() {
    setShareStatus(""); setManualLink("");
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: trip?.name || "MyTripBud", url }); return; }
      catch (failure) { if ((failure as { name?: string }).name === "AbortError") return; }
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      setShareStatus("Invite link copied.");
    } catch {
      setManualLink(url);
      setShareStatus("Select and copy this invite link:");
    }
  }

  useEffect(() => watchTrip(tripId, (value) => {
    setTrip(value); setLoading(false);
  }, (failure) => { setTrip(null); setError(errorMessage(failure)); setLoading(false); }), [tripId]);

  useEffect(() => {
    if (isMember || trip?.mode !== "team") return;
    let active = true;
    setJoinError("");
    void joinTrip(tripId, user).catch((failure) => { if (active) setJoinError(errorMessage(failure)); });
    return () => { active = false; };
  }, [isMember, trip?.mode, tripId, user, retry]);

  useEffect(() => {
    setLog([]); setLogLoading(true); setLogError("");
    if (!isMember) return;
    return watchSavingsLog(tripId, (entries) => { setLog(entries); setLogLoading(false); }, (failure) => {
      setLogError(errorMessage(failure)); setLogLoading(false);
    });
  }, [tripId, isMember]);

  useEffect(() => {
    if (!listRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = Array.from(listRef.current.children);
    anime({ targets, translateY: [16, 0], opacity: [0, 1], delay: anime.stagger(60), duration: 500, easing: "easeOutCubic" });
    return () => anime.remove(targets);
  }, [trip?.memberUids.length, isMember]);

  const members = trip ? Object.values(trip.members) : [];
  const shares = trip ? splitGoal(trip.goalAmount, trip.memberUids) : {};
  const totalSaved = members.reduce((sum, m) => sum + m.totalSaved, 0);
  const percent = trip && trip.goalAmount > 0 ? (totalSaved / trip.goalAmount) * 100 : 0;

  const { celebrate, closeCelebration } = useGoalCelebration(tripId, trip ? percent : null);

  if (loading) return <p role="status" className="text-center py-24">Loading trip…</p>;
  if (error || !trip) return <main className="max-w-lg mx-auto px-4 py-24 text-center space-y-4">
    <h1 className="font-display text-2xl">{error ? "Couldn't load this trip" : "Trip not found"}</h1>
    <p role={error ? "alert" : undefined}>{error || "This invite may be incorrect, or the trip was removed."}</p>
    <Link href="/" className="text-accent underline">Back to your trips</Link>
  </main>;
  if (!isMember) return <main className="max-w-lg mx-auto px-4 py-24 text-center space-y-4">
    {joinError ? <><p role="alert">{joinError}</p><button onClick={() => setRetry((value) => value + 1)} className="text-accent underline">Try joining again</button></> : <p role="status">Joining this trip…</p>}
    <Link href="/" className="block text-accent underline">Back to your trips</Link>
  </main>;

  const me = trip.members[user.uid];

  return (
    <>
      <main className="min-h-[100dvh] w-full px-4 pt-8 pb-28 sm:pb-24 max-w-lg mx-auto flex flex-col gap-5 sm:gap-6">
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
            Share invite link
          </button>
        )}

        {shareStatus && <p role="status" className="text-sm">{shareStatus}</p>}
        {manualLink && <input aria-label="Invite link" readOnly value={manualLink} onFocus={(event) => event.target.select()} className="w-full rounded-xl p-3 bg-black/5 dark:bg-white/10" />}

        <ProgressBar percent={percent} raised={totalSaved} goal={trip.goalAmount} />

        {me && (
          <AddSavingsForm
            onAdd={(amount, note) => addSavingsEntry(tripId, user, amount, note)}
          />
        )}

        {trip.mode === "team" && (
          <section id="members">
            <h2 className="text-xs uppercase tracking-[0.15em] text-slate dark:text-bone/60 mb-2 transition-colors duration-300">
              Who&apos;s saved what
            </h2>
            <div ref={listRef} className="flex flex-col gap-2">
              {members.map((m) => (
                <MemberCard key={m.uid} member={m} share={shares[m.uid]} />
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
                  updateSavingsEntry(tripId, entry.id, user.uid, amount, note)
                }
                onDelete={() => deleteSavingsEntry(tripId, entry.id, user.uid)}
              />
            ))}
            {logLoading && <p role="status">Loading savings…</p>}
            {logError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{logError}</p>}
            {!logLoading && !logError && log.length === 0 && (
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
          <Link href="/" className="flex flex-col items-center gap-1 text-ink dark:text-bone">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 11l8-7 8 7M6 10v9h12v-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px]">Home</span>
          </Link>

          {trip.mode === "team" && (
            <a
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

          <a
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
          onClose={closeCelebration}
        />
      )}
    </>
  );
}
