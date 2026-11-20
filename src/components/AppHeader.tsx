"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "./AuthProvider";

export default function AppHeader() {
  const { user, loading, busy, error, signIn, signOut } = useAuth();
  return <header className="relative z-10 max-w-lg mx-auto px-4 pt-5 space-y-3">
    <div className="flex items-center justify-between gap-3">
      <Link href="/" className="font-display text-lg">MyTripBud</Link>
      <div className="flex items-center gap-2">
        {!loading && <button onClick={user ? signOut : signIn} disabled={busy} className="rounded-full bg-black/5 dark:bg-white/10 px-4 py-2 text-xs disabled:opacity-50">{busy ? "Please wait…" : user ? "Sign out" : "Sign in"}</button>}
        <ThemeToggle />
      </div>
    </div>
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
  </header>;
}
