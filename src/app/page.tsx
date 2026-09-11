"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { watchAuth, signInWithGoogle, type User } from "@/lib/firebase";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => watchAuth((u) => { setUser(u); setLoading(false); }), []);

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-24 gap-10 text-center">
      <div className="max-w-md">
        <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-black/5 text-slate mb-6">
          Save together
        </span>
        <h1 className="font-display text-4xl sm:text-5xl text-ink mb-4">
          One goal.
          <br />
          Everyone chips in.
        </h1>
        <p className="text-slate text-sm sm:text-base">
          Set a trip fund, split it with friends, and watch everyone&apos;s savings add up in real time.
        </p>
      </div>

      {loading ? null : user ? (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => router.push("/create")}
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-bone transition-transform duration-300 ease-fluid active:scale-[0.98]"
          >
            Start a trip fund
          </button>
          <p className="text-xs text-slate">
            Signed in as {user.displayName}. Got a trip link from a friend? Open it directly.
          </p>
        </div>
      ) : (
        <button
          onClick={() => signInWithGoogle()}
          className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-bone transition-transform duration-300 ease-fluid active:scale-[0.98]"
        >
          Continue with Google
        </button>
      )}
    </main>
  );
}
