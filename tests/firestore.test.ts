import { readFileSync } from "node:fs";
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, collection, query, where, updateDoc, setDoc, deleteDoc, writeBatch, serverTimestamp, increment, type Firestore } from "firebase/firestore";
import { createTrip, joinTrip, addSavingsEntry, updateSavingsEntry, deleteSavingsEntry } from "../src/lib/trip-store";

let env: RulesTestEnvironment;
const alice = { uid: "alice", displayName: "Alice", photoURL: "" };
const bob = { uid: "bob", displayName: "Bob", photoURL: "" };
const asUser = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;
const tripRef = (db: Firestore, id: string) => doc(db, "trips", id);
const entries = async (db: Firestore, id: string) => (await getDocs(collection(db, "trips", id, "savingsLog"))).docs;
const total = async (db: Firestore, id: string, uid = "alice") => (await getDoc(tripRef(db, id))).data()!.members[uid].totalSaved;
beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-mytripbud", firestore: { rules: readFileSync("firestore.rules", "utf8") } });
});
beforeEach(async () => { await env.clearFirestore(); });
afterAll(async () => { await env?.cleanup(); });

describe("savings and access rules", () => {
  it("atomically adds concurrent entries without losing money", async () => {
    const db = asUser("alice");
    const id = await createTrip(db, "Goa", 1000, alice, "team");
    await Promise.all([addSavingsEntry(db, id, alice, 100, "First"), addSavingsEntry(asUser("alice"), id, alice, 250, "Second")]);
    expect(await total(db, id)).toBe(350);
    expect(await entries(db, id)).toHaveLength(2);
  });
  it("edits and deletes using stored amounts, including concurrent edits", async () => {
    const db = asUser("alice");
    const id = await createTrip(db, "Goa", 1000, alice, "team");
    await addSavingsEntry(db, id, alice, 100, "");
    const [entry] = await entries(db, id);
    await Promise.all([updateSavingsEntry(db, id, entry.id, "alice", 200, "One"), updateSavingsEntry(asUser("alice"), id, entry.id, "alice", 350, "Two")]);
    expect(await total(db, id)).toBe((await getDoc(entry.ref)).data()!.amount);
    await deleteSavingsEntry(db, id, entry.id, "alice");
    expect(await total(db, id)).toBe(0);
    expect(await entries(db, id)).toHaveLength(0);
    await expect(deleteSavingsEntry(db, id, entry.id, "alice")).rejects.toThrow("already deleted");
    expect(await total(db, id)).toBe(0);
  });
  it("resolves an edit/delete race without a negative or orphaned balance", async () => {
    const db = asUser("alice");
    const id = await createTrip(db, "Goa", 1000, alice, "team");
    await addSavingsEntry(db, id, alice, 100, "");
    const [entry] = await entries(db, id);
    await Promise.allSettled([updateSavingsEntry(db, id, entry.id, "alice", 400, ""), deleteSavingsEntry(asUser("alice"), id, entry.id, "alice")]);
    expect(await entries(db, id)).toHaveLength(0);
    expect(await total(db, id)).toBe(0);
  });
  it("joins idempotently, preserves savings, and includes joined trips in the member query", async () => {
    const a = asUser("alice"), b = asUser("bob");
    const team = await createTrip(a, "Team", 1000, alice, "team");
    const solo = await createTrip(b, "Solo", 500, bob, "individual");
    await Promise.all([joinTrip(b, team, bob), joinTrip(asUser("bob"), team, bob)]);
    await addSavingsEntry(b, team, bob, 80, "");
    await joinTrip(b, team, bob);
    expect(await total(b, team, "bob")).toBe(80);
    const trips = await getDocs(query(collection(b, "trips"), where("memberUids", "array-contains", "bob")));
    expect(trips.docs.map((item) => item.id).sort()).toEqual([team, solo].sort());
  });
  it("denies anonymous access, private-trip reads/joins, and unrestricted trip listing", async () => {
    const a = asUser("alice"), b = asUser("bob");
    const solo = await createTrip(a, "Private", 100, alice, "individual");
    const team = await createTrip(a, "Shared", 100, alice, "team");
    const anon = env.unauthenticatedContext().firestore() as unknown as Firestore;
    await assertFails(getDoc(tripRef(anon, team)));
    await assertFails(getDoc(tripRef(b, solo)));
    await assertFails(joinTrip(b, solo, bob));
    await assertFails(getDocs(collection(b, "trips")));
    await assertSucceeds(getDoc(tripRef(b, team)));
    await assertFails(getDocs(collection(b, "trips", team, "savingsLog")));
    expect((await getDoc(tripRef(b, "missing"))).exists()).toBe(false);
  });
  it("denies changes to another member, trip settings, and unbalanced writes", async () => {
    const a = asUser("alice"), b = asUser("bob");
    const id = await createTrip(a, "Team", 1000, alice, "team");
    await joinTrip(b, id, bob);
    await addSavingsEntry(a, id, alice, 100, "");
    const [entry] = await entries(a, id);
    await assertFails(updateDoc(tripRef(b, id), { goalAmount: 1 }));
    await assertFails(updateDoc(tripRef(b, id), { "members.alice.totalSaved": 1 }));
    await assertFails(updateDoc(tripRef(a, id), { "members.alice.totalSaved": 900 }));
    await assertFails(updateDoc(doc(b, entry.ref.path), { amount: 99 }));
    await assertFails(deleteDoc(doc(b, entry.ref.path)));
    await assertFails(updateDoc(entry.ref, { amount: 200 }));
    await assertFails(deleteDoc(entry.ref));
    await assertFails(setDoc(doc(collection(a, "trips", id, "savingsLog")), { uid: "alice", displayName: "Alice", amount: 100, note: null, createdAt: serverTimestamp() }));
    expect(await total(a, id)).toBe(100);
  });
  it("rejects invalid/forged entries and rolls back the paired total", async () => {
    const a = asUser("alice");
    const id = await createTrip(a, "Team", 1000, alice, "team");
    for (const amount of [-1, 0, 1.5, 1000000001]) {
      const ref = doc(collection(a, "trips", id, "savingsLog"));
      const batch = writeBatch(a);
      batch.set(ref, { uid: "alice", displayName: "Alice", amount, note: null, createdAt: serverTimestamp() });
      batch.update(tripRef(a, id), { "members.alice.totalSaved": increment(amount), lastSavingsEntryId: ref.id });
      await assertFails(batch.commit());
    }
    expect(await total(a, id)).toBe(0);
    expect(await entries(a, id)).toHaveLength(0);
  });
  it("rejects a join that also resets another member or changes the goal", async () => {
    const a = asUser("alice"), b = asUser("bob");
    const id = await createTrip(a, "Team", 1000, alice, "team");
    await assertFails(updateDoc(tripRef(b, id), {
      memberUids: ["alice", "bob"], "members.bob": { ...bob, totalSaved: 0 }, goalAmount: 1,
    }));
    await assertFails(updateDoc(tripRef(b, id), {
      memberUids: ["bob"], members: { bob: { ...bob, totalSaved: 0 } },
    }));
  });
});
