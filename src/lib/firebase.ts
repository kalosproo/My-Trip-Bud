"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, collection, onSnapshot, query, orderBy, where, type FirestoreError } from "firebase/firestore";
import * as store from "./trip-store";

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
export type { User } from "firebase/auth";
export type { Member, Trip, SavingsEntry } from "./trip-store";

if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  void analyticsSupported().then((ok) => { if (ok) getAnalytics(app); }).catch(() => {});
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    if ((error as { code?: string }).code === "auth/popup-blocked") {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw error;
  }
}
export const completeRedirectSignIn = () => getRedirectResult(auth);
export const signOutUser = () => signOut(auth);
export const watchAuth = (cb: Parameters<typeof onAuthStateChanged>[1], onError: (error: Error) => void) => onAuthStateChanged(auth, cb, onError);

export const createTrip = (...args: [string, number, store.Profile, store.Trip["mode"]]) => store.createTrip(db, ...args);
export const joinTrip = (tripId: string, user: store.Profile) => store.joinTrip(db, tripId, user);
export const addSavingsEntry = (...args: [string, store.Profile, number, string]) => store.addSavingsEntry(db, ...args);
export const updateSavingsEntry = (...args: [string, string, string, number, string]) => store.updateSavingsEntry(db, ...args);
export const deleteSavingsEntry = (...args: [string, string, string]) => store.deleteSavingsEntry(db, ...args);

type OnError = (error: FirestoreError) => void;
export function watchUserTrips(userId: string, cb: (trips: store.Trip[]) => void, onError: OnError) {
  return onSnapshot(query(collection(db, "trips"), where("memberUids", "array-contains", userId)), (snap) => {
    cb(snap.docs.map((item) => ({ ...item.data(), id: item.id } as store.Trip)).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)));
  }, onError);
}
export function watchTrip(tripId: string, cb: (trip: store.Trip | null) => void, onError: OnError) {
  return onSnapshot(doc(db, "trips", tripId), (snap) => cb(snap.exists() ? { ...snap.data(), id: snap.id } as store.Trip : null), onError);
}
export function watchSavingsLog(tripId: string, cb: (entries: store.SavingsEntry[]) => void, onError: OnError) {
  return onSnapshot(query(collection(db, "trips", tripId, "savingsLog"), orderBy("createdAt", "desc")), (snap) => {
    cb(snap.docs.map((entry) => ({ ...entry.data(), id: entry.id } as store.SavingsEntry)));
  }, onError);
}
