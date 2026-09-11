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
  arrayUnion,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
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

// Analytics only works in the browser (not during server render), and only
// if the browser actually supports it — guard both.
if (typeof window !== "undefined") {
  analyticsSupported().then((ok) => {
    if (ok) getAnalytics(app);
  });
}

// ---- Auth ----
export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export function signOutUser() {
  return signOut(auth);
}
export function watchAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

// ---- Types ----
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

// ---- Trip creation / joining ----
export async function createTrip(name: string, goalAmount: number, user: User) {
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
    memberUids: [user.uid],
    members: { [user.uid]: member },
  });
  return ref.id;
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

// ---- Live subscriptions ----
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

// ---- Adding a savings entry (bumps the member's running total) ----
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