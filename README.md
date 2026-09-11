# Tripfund

Goal-based trip savings tracker for friend groups. One trip, one shared goal,
split equally, everyone logs their own savings, everyone watches the fund fill up live.

Stack: Next.js (Vercel, free) + Firebase Auth + Firestore (Spark plan, free).

## 1. Firebase setup (free)

1. Go to https://console.firebase.google.com → **Add project**.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
3. **Build → Firestore Database → Create database** → start in **production mode**.
4. Go to **Project settings → General → Your apps → Add app → Web (</>)**.
   Copy the config values into `.env.local` (copy `.env.local.example` → `.env.local` first).
5. **Firestore → Rules**, replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /trips/{tripId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null; // any signed-in friend can join / log savings
      match /savingsLog/{entryId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      }
    }
  }
}
```

This keeps it open to any signed-in Google account — fine for a small friend-group app.
Tighten later to `request.auth.uid in resource.data.memberUids` once you want stricter access.

## 2. Run locally

```
npm install
npm run dev
```

## 3. Deploy (free)

1. Push this folder to a GitHub repo.
2. https://vercel.com → **Add New Project** → import the repo.
3. Add the same six `NEXT_PUBLIC_FIREBASE_*` env vars in Vercel's project settings.
4. Deploy. Vercel's Hobby plan covers this at no cost.

## How it works

- `/` — sign in with Google, then "Start a trip fund".
- `/create` — set trip name + goal amount → creates the trip, redirects to its dashboard.
- `/trip/[tripId]` — the dashboard. Share this URL with friends; any signed-in friend
  who opens it auto-joins the trip and the goal auto-splits across however many people have joined.
  Each person logs their own savings; the fund total and everyone's progress update live.

## Notes

- Split is a simple equal share: `goalAmount / number of members`.
- This is a **pre-trip savings tracker only** — no expense/settle-up tracking during the trip.
- No backend server — everything talks to Firestore directly from the browser via the free client SDK.
"# Trippy-Mate" 
