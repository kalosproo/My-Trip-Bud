"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { watchAuth, completeRedirectSignIn, signInWithGoogle, signOutUser, type User } from "@/lib/firebase";
import { errorMessage } from "@/lib/errors";

type AuthState = { user: User | null; loading: boolean; busy: boolean; error: string; signIn: () => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const unsubscribe = watchAuth((next) => { setUser(next); setLoading(false); }, (failure) => {
      setError(errorMessage(failure)); setLoading(false);
    });
    void completeRedirectSignIn().catch((failure) => { if (active) setError(errorMessage(failure)); });
    return () => { active = false; unsubscribe(); };
  }, []);
  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true); setError("");
    try { await action(); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  return <AuthContext.Provider value={{ user, loading, busy, error, signIn: () => run(signInWithGoogle), signOut: () => run(signOutUser) }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth requires AuthProvider");
  return context;
}

export function SignInPrompt() {
  const { signIn, busy } = useAuth();
  return <main className="max-w-lg mx-auto px-4 py-24 text-center space-y-4">
    <h1 className="font-display text-2xl">Sign in to your trip fund</h1>
    <button onClick={signIn} disabled={busy} className="rounded-full bg-ink dark:bg-bone text-bone dark:text-ink px-6 py-3 disabled:opacity-50">{busy ? "Signing in…" : "Continue with Google"}</button>
    <p className="text-sm text-slate dark:text-bone/70">Opening an invite in WhatsApp or Instagram? Choose Open in browser if sign-in fails.</p>
  </main>;
}
