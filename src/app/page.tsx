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
    <main className="min-h-[100dvh] w-full flex flex-col items-center justify-center px-4 py-24 gap-10 text-center">
      <div className="max-w-md w-full">
        <p className="font-display text-sm text-slate dark:text-bone/60 mb-8">My Trip Bud</p>
        <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-black/5 dark:bg-white/10 text-slate dark:text-bone/70 mb-6">
          Save together
        </span>
        <h1 className="font-display text-4xl sm:text-5xl text-ink dark:text-bone mb-4 break-words">
          One goal.
          <br />
          Everyone chips in.
        </h1>
        <p className="text-slate dark:text-bone/70 text-sm sm:text-base">
          Set a trip fund, split it with friends, and watch everyone&apos;s savings add up in real time.
        </p>
      </div>

      {loading ? null : user ? (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => router.push("/create")}
            className="rounded-full bg-ink dark:bg-bone px-6 py-3 text-sm font-medium text-bone dark:text-ink transition-transform duration-300 ease-fluid active:scale-[0.98]"
          >
            Start a trip fund
          </button>
          <p className="text-xs text-slate dark:text-bone/60">
            Signed in as {user.displayName}. Got a trip link from a friend? Open it directly.
          </p>
        </div>
      ) : (
        <button
          onClick={() => signInWithGoogle()}
          className="rounded-full bg-ink dark:bg-bone px-6 py-3 text-sm font-medium text-bone dark:text-ink transition-transform duration-300 ease-fluid active:scale-[0.98]"
        >
          Continue with Google
        </button>
      )}
    </main>
  );
}            Start a trip fund
          </button>
          <p className="text-xs text-slate dark:text-bone/60">
            Signed in as {user.displayName}. Got a trip link from a friend? Open it directly.
          </p>
        </div>
      ) : (
        <button
          onClick={() => signInWithGoogle()}
          className="rounded-full bg-ink dark:bg-bone px-6 py-3 text-sm font-medium text-bone dark:text-ink transition-transform duration-300 ease-fluid active:scale-[0.98]"
        >
          Continue with Google
        </button>
      )}
    </main>
  );
}          </button>
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
