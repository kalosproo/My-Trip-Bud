"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { watchAuth, watchUserTrip, signInWithGoogle, signOutUser, type User, type Trip } from "@/lib/firebase";

function MenuIcon({ type }: { type: "trip" | "create" | "account" }) {
  if (type === "trip") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 20v-5h6v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "create") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 20c.7-3.3 3.1-5 7-5s6.3 1.7 7 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripLoading, setTripLoading] = useState(false);
  const router = useRouter();

  useEffect(() => watchAuth((u) => { setUser(u); setLoading(false); }), []);

  useEffect(() => {
    if (!user) {
      setTrip(null);
      setTripLoading(false);
      return;
    }

    setTripLoading(true);
    return watchUserTrip(user.uid, (existingTrip) => {
      setTrip(existingTrip);
      setTripLoading(false);
    });
  }, [user]);

  async function handleSignIn() {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in failed", error);
    }
  }

  return (
    <main className="min-h-[100dvh] w-full px-4 py-5 sm:py-8">
      <div className="w-full max-w-lg mx-auto flex flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/")}
            className="font-display text-lg text-ink dark:text-bone transition-colors duration-300"
            aria-label="MyTripBud home"
          >
            MyTripBud
          </button>

          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate dark:text-bone/60 hidden sm:inline truncate max-w-36">{user.displayName}</span>
              <button
                onClick={() => signOutUser()}
                className="rounded-full bg-black/5 dark:bg-white/10 px-4 py-2 text-xs font-medium text-ink dark:text-bone transition-all duration-300 active:scale-[0.98]"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="rounded-full bg-ink dark:bg-bone px-4 py-2 text-xs font-medium text-bone dark:text-ink transition-all duration-300 active:scale-[0.98]"
            >
              Sign in
            </button>
          )}
        </header>

        <section className="pt-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate dark:text-bone/50 mb-3">Your travel fund</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] text-ink dark:text-bone transition-colors duration-300">
            What are we planning?
          </h1>
          <p className="text-sm text-slate dark:text-bone/70 mt-4 max-w-md transition-colors duration-300">
            Save together, keep the plan in one place, and know exactly where your trip fund stands.
          </p>
        </section>

        <section className="flex flex-col gap-3" aria-label="MyTripBud menu">
          {user && trip ? (
            <button
              onClick={() => router.push(`/trip/${trip.id}`)}
              className="group w-full text-left rounded-[1.6rem] bg-white dark:bg-panel ring-1 ring-black/5 dark:ring-white/10 shadow-soft dark:shadow-soft-dark p-5 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <span className="w-11 h-11 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-ink dark:text-bone shrink-0">
                  <MenuIcon type="trip" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-ink dark:text-bone">My Trip</span>
                    <span className="rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-slate dark:text-bone/60">Saved</span>
                  </span>
                  <span className="block text-xs text-slate dark:text-bone/60 mt-1 truncate">{trip.name} · ₹{trip.goalAmount.toLocaleString("en-IN")} goal</span>
                </span>
                <span className="text-lg text-slate dark:text-bone/50 group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </button>
          ) : user && tripLoading ? (
            <div className="rounded-[1.6rem] bg-white dark:bg-panel ring-1 ring-black/5 dark:ring-white/10 p-5 text-sm text-slate dark:text-bone/60">
              Checking your saved trip…
            </div>
          ) : null}

          <button
            onClick={() => router.push("/create")}
            className="group w-full text-left rounded-[1.6rem] bg-white dark:bg-panel ring-1 ring-black/5 dark:ring-white/10 shadow-soft dark:shadow-soft-dark p-5 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <span className="w-11 h-11 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-ink dark:text-bone shrink-0">
                <MenuIcon type="create" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink dark:text-bone">Create a Trip</span>
                <span className="block text-xs text-slate dark:text-bone/60 mt-1">Start a new savings goal for your next adventure</span>
              </span>
              <span className="text-lg text-slate dark:text-bone/50 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </button>

          {user ? (
            <button
              onClick={() => signOutUser()}
              className="group w-full text-left rounded-[1.6rem] bg-white dark:bg-panel ring-1 ring-black/5 dark:ring-white/10 shadow-soft dark:shadow-soft-dark p-5 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <span className="w-11 h-11 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-ink dark:text-bone shrink-0">
                  <MenuIcon type="account" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink dark:text-bone">Account</span>
                  <span className="block text-xs text-slate dark:text-bone/60 mt-1 truncate">Signed in as {user.email ?? user.displayName ?? "your account"}</span>
                </span>
                <span className="text-xs text-slate dark:text-bone/50">Sign out</span>
              </div>
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="group w-full text-left rounded-[1.6rem] bg-white dark:bg-panel ring-1 ring-black/5 dark:ring-white/10 shadow-soft dark:shadow-soft-dark p-5 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <span className="w-11 h-11 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-ink dark:text-bone shrink-0">
                  <MenuIcon type="account" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink dark:text-bone">Sign in</span>
                  <span className="block text-xs text-slate dark:text-bone/60 mt-1">Access your saved trip plans</span>
                </span>
                <span className="text-lg text-slate dark:text-bone/50 group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </button>
          )}
        </section>

        <p className="text-[11px] text-slate dark:text-bone/45 text-center pt-2">
          MyTripBud · save for trips together
        </p>
      </div>
    </main>
  );
}
