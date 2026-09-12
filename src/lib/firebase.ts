"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  where,
  limit,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export type { User };

if (typeof window !== "undefined") {
  analyticsSupported().then((ok) => {
    if (ok) getAnalytics(app);
  });
}

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export function signOutUser() {
  return signOut(auth);
}
export function watchAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export type Member = {
  uid: string;
  displayName: string;
  photoURL: string;
  totalSaved: number;
};

export type Trip = {
  id: string;
  name: string;
  goalAmount: number;
  createdBy: string;
  mode: "individual" | "team";
  memberUids: string[];
  members: Record<string, Member>;
};

export type SavingsEntry = {
  id: string;
  uid: string;
  displayName: string;
  amount: number;
  note?: string;
  createdAt?: unknown;
};

export async function createTrip(
  name: string,
  goalAmount: number,
  user: User,
  mode: "individual" | "team"
) {
  const member: Member = {
    uid: user.uid,
    displayName: user.displayName ?? "Friend",
    photoURL: user.photoURL ?? "",
    totalSaved: 0,
  };
  const ref = await addDoc(collection(db, "trips"), {
    name,
    goalAmount,
    createdBy: user.uid,
    mode,
    memberUids: [user.uid],
    members: { [user.uid]: member },
  });
  return ref.id;
}

export function watchUserTrip(userId: string, cb: (trip: Trip | null) => void) {
  const q = query(collection(db, "trips"), where("createdBy", "==", userId), limit(1));
  return onSnapshot(q, (snap) => {
    const item = snap.docs[0];
    cb(item ? ({ id: item.id, ...item.data() } as Trip) : null);
  });
}

export async function joinTrip(tripId: string, user: User) {
  const member: Member = {
    uid: user.uid,
    displayName: user.displayName ?? "Friend",
    photoURL: user.photoURL ?? "",
    totalSaved: 0,
  };
  await updateDoc(doc(db, "trips", tripId), {
    memberUids: arrayUnion(user.uid),
    [`members.${user.uid}`]: member,
  });
}

export function watchTrip(tripId: string, cb: (trip: Trip | null) => void) {
  return onSnapshot(doc(db, "trips", tripId), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as Trip) : null);
  });
}

export function watchSavingsLog(tripId: string, cb: (entries: SavingsEntry[]) => void) {
  const q = query(collection(db, "trips", tripId, "savingsLog"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavingsEntry)));
  });
}

export async function addSavingsEntry(
  tripId: string,
  user: User,
  amount: number,
  note: string,
  currentTotal: number
) {
  await addDoc(collection(db, "trips", tripId, "savingsLog"), {
    uid: user.uid,
    displayName: user.displayName ?? "Friend",
    amount,
    note: note || null,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "trips", tripId), {
    [`members.${user.uid}.totalSaved`]: currentTotal + amount,
  });
}

export async function updateSavingsEntry(
  tripId: string,
  entryId: string,
  uid: string,
  oldAmount: number,
  newAmount: number,
  note: string,
  currentTotal: number
) {
  await updateDoc(doc(db, "trips", tripId, "savingsLog", entryId), {
    amount: newAmount,
    note: note || null,
  });
  await updateDoc(doc(db, "trips", tripId), {
    [`members.${uid}.totalSaved`]: currentTotal - oldAmount + newAmount,
  });
}

export async function deleteSavingsEntry(
  tripId: string,
  entryId: string,
  uid: string,
  amount: number,
  currentTotal: number
) {
  await deleteDoc(doc(db, "trips", tripId, "savingsLog", entryId));
  await updateDoc(doc(db, "trips", tripId), {
    [`members.${uid}.totalSaved`]: currentTotal - amount,
  });
}