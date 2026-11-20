import {
  collection, doc, addDoc, writeBatch, increment, runTransaction,
  serverTimestamp, FieldPath, getDocFromServer, type Firestore,
} from "firebase/firestore";
import { validateAmount } from "./money";

export type Profile = { uid: string; displayName: string | null; photoURL: string | null };
export type Member = { uid: string; displayName: string; photoURL: string; totalSaved: number };
export type Trip = {
  id: string; name: string; goalAmount: number; createdBy: string;
  mode: "individual" | "team"; memberUids: string[]; members: Record<string, Member>;
};
export type SavingsEntry = {
  id: string; uid: string; displayName: string; amount: number;
  note?: string | null; createdAt?: unknown;
};

function memberFor(user: Profile): Member {
  return { uid: user.uid, displayName: user.displayName || "Friend", photoURL: user.photoURL || "", totalSaved: 0 };
}

export async function createTrip(db: Firestore, name: string, goalAmount: number, user: Profile, mode: Trip["mode"]) {
  validateAmount(goalAmount);
  if (!name.trim() || name.trim().length > 120) throw new Error("Enter a trip name of 1–120 characters.");
  const ref = await addDoc(collection(db, "trips"), {
    name: name.trim(), goalAmount, createdBy: user.uid, mode,
    memberUids: [user.uid], members: { [user.uid]: memberFor(user) },
  });
  return ref.id;
}

export async function joinTrip(db: Firestore, tripId: string, user: Profile) {
  const ref = doc(db, "trips", tripId);
  for (let attempt = 0; attempt < 3; attempt++) {
    let readMembers = "";
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("This trip no longer exists.");
        const trip = snap.data() as Trip;
        readMembers = JSON.stringify(trip.memberUids);
        // Retried joins must never reset an existing member's balance.
        if (trip.memberUids.includes(user.uid)) return;
        if (trip.mode !== "team") throw new Error("This is a private trip.");
        tx.update(ref, "memberUids", [...trip.memberUids, user.uid], new FieldPath("members", user.uid), memberFor(user));
      });
      return;
    } catch (error) {
      if ((error as { code?: string }).code !== "permission-denied" || attempt === 2) throw error;
      const latest = await getDocFromServer(ref);
      if (latest.data()?.memberUids.includes(user.uid)) return;
      // Rules can reject a stale write before the transaction conflict is returned.
      // Retry only when the membership actually changed since our transaction read.
      if (!latest.exists() || JSON.stringify(latest.data().memberUids) === readMembers) throw error;
    }
  }
}

export async function addSavingsEntry(db: Firestore, tripId: string, user: Profile, amount: number, note: string) {
  validateAmount(amount);
  if (note.length > 500) throw new Error("Keep notes to 500 characters.");
  const entry = doc(collection(db, "trips", tripId, "savingsLog"));
  const batch = writeBatch(db);
  batch.set(entry, { uid: user.uid, displayName: user.displayName || "Friend", amount, note: note || null, createdAt: serverTimestamp() });
  batch.update(doc(db, "trips", tripId), new FieldPath("members", user.uid, "totalSaved"), increment(amount), "lastSavingsEntryId", entry.id);
  await batch.commit();
}

export async function updateSavingsEntry(db: Firestore, tripId: string, entryId: string, uid: string, amount: number, note: string) {
  validateAmount(amount);
  if (note.length > 500) throw new Error("Keep notes to 500 characters.");
  await changeEntry(db, tripId, entryId, uid, { amount, note });
}

export async function deleteSavingsEntry(db: Firestore, tripId: string, entryId: string, uid: string) {
  await changeEntry(db, tripId, entryId, uid, null);
}

async function changeEntry(db: Firestore, tripId: string, entryId: string, uid: string, change: { amount: number; note: string } | null) {
  const entry = doc(db, "trips", tripId, "savingsLog", entryId);
  for (let attempt = 0; attempt < 3; attempt++) {
    let readAmount: number | undefined;
    try {
      await runTransaction(db, async (tx) => {
        const snapshot = await tx.get(entry);
        if (!snapshot.exists()) throw new Error("This entry was already deleted. Refresh the log and try again.");
        const saved = snapshot.data() as SavingsEntry;
        readAmount = saved.amount;
        if (saved.uid !== uid) throw new Error("You can only change your own savings.");
        if (change) tx.update(entry, { amount: change.amount, note: change.note || null });
        else tx.delete(entry);
        tx.update(doc(db, "trips", tripId), new FieldPath("members", uid, "totalSaved"), increment((change?.amount ?? 0) - saved.amount), "lastSavingsEntryId", entryId);
      });
      return;
    } catch (error) {
      if ((error as { code?: string }).code !== "permission-denied" || attempt === 2 || readAmount === undefined) throw error;
      const latest = await getDocFromServer(entry);
      if (!latest.exists()) throw new Error("This entry was already deleted. Refresh the log and try again.");
      // A concurrent edit may fail the balance rule before Firestore reports a
      // retryable conflict. Only retry a proven stale amount, never an access error.
      if (latest.data().amount === readAmount) throw error;
    }
  }
}
