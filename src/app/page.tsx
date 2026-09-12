"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { watchAuth, signInWithGoogle, type User } from "@/lib/firebase";
import ProgressBar from "@/components/ProgressBar";
import MemberCard from "@/components/MemberCard";
import TripIllustration from "@/components/TripIllustration";

const previewMembers = [
  { uid: "1", displayName: "Rahul", photoURL: "", totalSaved: 12000 },
  { uid: "2", displayName: "Kiran", photoURL: "", totalSaved: 10000 },
  { uid: "3", displayName: "Teja", photoURL: "", totalSaved: 7000 },
];
const previewShare = 15000;
const previewGoal = 45000;
const previewRaised = previewMembers.reduce((s, m) => s + m.totalSaved, 0);
const previewPercent = (previewRaised / previewGoal) * 100;

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => watchAuth((u) => { setUser(u); setLoading(false); }), []);

  return (
    <main className="min-h-[100dvh] w-full flex flex-col items-center px-4 py-16 sm:py-20 gap-8">
      <div className="max-w-md w-full text-center">
        <p className="font-display text-sm text-slate dark:text-bone/60 mb-2 transition-colors duration-300">My Trip Bud</p>
        <h1 className="font-display text-3xl sm:text-4xl text-ink dark:text-bone mb-3 break-words transition-colors duration-300">
          One goal. Everyone chips in.
        </h1>
        <p className="text-slate dark:text-bone/70 text-sm transition-colors duration-300">
          Set a trip fund, split it with friends, and watch everyone&apos;s savings add up in real time.
        </p>
      </div>

      <div className="w-full max-w-md rounded-[2rem] bg-white dark:bg-panel ring-1 ring-black/5 dark:ring-white/10 shadow-soft dark:shadow-soft-dark p-5 sm:p-6 flex flex-col gap-5 transition-colors duration-300">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-black/5 dark:bg-white/10 text-slate dark:text-bone/70 mb-3 transition-colors duration-300">
              Trip fund
            </span>
            <h2 className="font-display text-2xl text-ink dark:text-bone transition-colors duration-300">Kerala 2027</h2>
            <p className="text-slate dark:text-bone/70 text-xs mt-1 transition-colors duration-300">3 friends · 1 goal</p>
          </div>
          <TripIllustration className="w-16 h-12 text-ink/60 dark:text-bone/40 shrink-0 hidden sm:block" />
        </div>

        <ProgressBar percent={previewPercent} raised={previewRaised} goal={previewGoal} />

        <div className="flex flex-col gap-2">
          {previewMembers.map((m) => (
            <MemberCard key={m.uid} member={m} share={previewShare} />
          ))}
        </div>
        <p className="text-[11px] text-center text-slate dark:text-bone/50 -mt-1 transition-colors duration-300">
          A live look at how your own trip fund will feel.
        </p>
      </div>

      {loading ? null : user ? (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => router.push("/create")}
            className="rounded-full bg-ink dark:bg-bone px-6 py-3.5 sm:py-3 text-sm font-medium text-bone dark:text-ink transition-all duration-300 ease-fluid active:scale-[0.98]"
          >
            Start a trip fund
          </button>
          <p className="text-xs text-slate dark:text-bone/60 text-center transition-colors duration-300">
            Signed in as {user.displayName}. Got a trip link from a friend? Open it directly.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => signInWithGoogle()}
            className="rounded-full bg-ink dark:bg-bone px-6 py-3.5 sm:py-3 text-sm font-medium text-bone dark:text-ink transition-all duration-300 ease-fluid active:scale-[0.98]"
          >
            Continue with Google
          </button>
          <p className="text-xs text-slate dark:text-bone/60 text-center transition-colors duration-300">
            Sign in only when you&apos;re ready to start your own fund.
          </p>
        </div>
      )}
    </main>
  );
}
