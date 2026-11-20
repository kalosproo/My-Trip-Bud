"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useGoalCelebration(tripId: string, percent: number | null) {
  const previous = useRef<{ tripId: string; percent: number } | null>(null);
  const shown = useRef(new Set<string>());
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (percent === null) { previous.current = null; setCelebrate(false); return; }
    const last = previous.current;
    const key = `mytripbud:celebrated:v1:${tripId}`;
    let alreadyShown = shown.current.has(tripId);
    try { alreadyShown ||= localStorage.getItem(key) === "true"; } catch { /* Use the in-memory guard. */ }
    if (last?.tripId === tripId && last.percent < 100 && percent >= 100 && !alreadyShown) {
      shown.current.add(tripId);
      try { localStorage.setItem(key, "true"); } catch { /* Celebration still works without storage. */ }
      setCelebrate(true);
    }
    previous.current = { tripId, percent };
  }, [tripId, percent]);
  const closeCelebration = useCallback(() => setCelebrate(false), []);
  return { celebrate, closeCelebration };
}
