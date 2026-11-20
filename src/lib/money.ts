// Amounts are whole rupees, matching the application's number inputs.
export function validateAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1_000_000_000) {
    throw new Error("Enter a whole-rupee amount between ₹1 and ₹1,000,000,000.");
  }
}

export function splitGoal(goal: number, uids: string[]): Record<string, number> {
  const sorted = [...uids].sort();
  const base = Math.floor(goal / sorted.length);
  const remainder = goal % sorted.length;
  return Object.fromEntries(sorted.map((uid, index) => [uid, base + (index < remainder ? 1 : 0)]));
}
