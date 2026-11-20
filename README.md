# MyTripBud

A trip savings tracker built with Next.js, React, Firebase Authentication,
Firestore and anime.js. Track a private solo fund or share a team goal with friends.
This records savings; it does not move money or settle expenses.

## Run locally

Use Node.js 22 or later.

```sh
npm ci
cp .env.local.example .env.local
npm run dev
```

Fill `.env.local` with your Firebase web app configuration. In Firebase, enable
Google authentication and create a Firestore database. Add localhost and your
production domain to Authentication's authorized domains. The measurement ID is
optional; analytics is skipped when it is absent.

## Firebase rules and deployment

`firestore.rules` is the source of truth. Deploy it to the same Firebase project
as the app, together with this application version:

```sh
npx firebase login
npx firebase deploy --only firestore:rules --project YOUR_FIREBASE_PROJECT_ID
```

The old client writes totals separately and is incompatible with these rules.
Deploy the new client and rules in a coordinated release, then ask users with
old tabs to reload. A temporary permission error during that switch can be retried.
Creating this PR does not deploy Firebase rules or change production data.

- Solo trips are readable only by their owner.
- Team URLs are invitations: a signed-in person with the URL can read the team
  summary and join. Treat the URL as shareable access, not a private secret.
- Trip lists and savings logs require membership. Joining adds only the signed-in
  user's zero-balance profile and never resets an existing member.
- Members may create, edit or delete only their own savings entries. Goal,
  ownership, membership and other people's balances cannot be changed through
  a savings update.
- Entry changes and totals must balance in the same atomic write.
  `lastSavingsEntryId` links each balance update to the entry checked by the rules.
  It is added automatically to existing trips on the next savings change.

Existing trips keep their data. This change prevents future lost updates; it
cannot reconstruct entries or balances already lost under the previous code.
Review any known discrepancies against the saved log before deployment.

For hosting, configure the same `NEXT_PUBLIC_FIREBASE_*` values and optionally
`NEXT_PUBLIC_SITE_URL` (used by robots/sitemap). Run `npm run build` and deploy
through your hosting provider. Configure a custom auth domain/proxy if necessary
for redirect sign-in in browsers that block third-party storage; see Firebase's
[redirect sign-in guidance](https://firebase.google.com/docs/auth/web/redirect-best-practices).
A blocked popup falls back to redirect. Other sign-in errors are shown with an
Open in browser hint for invitations opened inside messaging apps.

## App flow

- `/`: sign in and see every trip you created or joined.
- `/create`: choose Just me or With friends, then enter a name and savings goal.
- `/trip/[tripId]`: members see live progress and can add, edit or delete their
  own entries. Signed-in invitees automatically join team trips before the log loads.
- Sharing uses the device share sheet, then clipboard, then a selectable URL.
- Amounts are positive whole rupees, up to ₹1,000,000,000 per entry or goal.
  Team shares use whole-rupee division; remaining rupees are assigned by sorted
  member UID so the shares always sum to the goal.
- A celebration appears only on a live crossing of the goal, once per trip per
  browser. It respects reduced motion, keyboard focus and Escape.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run test:rules
npm run build
```

The rules tests require Java 21+ and download the Firestore emulator on first use.
They use the isolated `demo-mytripbud` project and do not touch production.
Tests cover concurrent additions and edits, edit/delete races, repeated joins,
private trips, denied writes, membership queries, input errors, sharing fallbacks,
auth feedback, progress animation and celebration lifecycle. GitHub Actions runs
these checks and a build using dummy Firebase configuration. A production build
requires Firebase environment values; real Google OAuth still needs a manual
check on your configured authorized domain.

The data layer follows Firebase's [atomic write and transaction model](https://firebase.google.com/docs/firestore/manage-data/transactions).
