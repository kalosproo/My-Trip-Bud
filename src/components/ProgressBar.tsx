"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export default function ProgressBar({ percent }: { percent: number }) {
  const fillRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const clamped = Math.max(0, Math.min(100, percent));

  useEffect(() => {
    if (!fillRef.current) return;
    const counter = { value: 0 };
    anime({
      targets: fillRef.current,
      width: `${clamped}%`,
      duration: 900,
      easing: "cubicBezier(.32,.72,0,1)",
    });
    anime({
      targets: counter,
      value: clamped,
      round: 1,
      duration: 900,
      easing: "cubicBezier(.32,.72,0,1)",
      update: () => {
        if (labelRef.current) labelRef.current.textContent = `${counter.value}%`;
      },
    });
  }, [clamped]);

  return (
    <div className="w-full rounded-[1.5rem] bg-black/5 dark:bg-white/10 p-1.5 ring-1 ring-black/5 dark:ring-white/10 transition-colors duration-300">
      <div className="rounded-[calc(1.5rem-0.375rem)] bg-white dark:bg-panel shadow-inset-soft dark:shadow-inset-soft-dark px-4 py-3 transition-colors duration-300">
        <div className="flex items-center justify-between mb-2 text-sm text-slate dark:text-bone/70 transition-colors duration-300">
          <span>Fund progress</span>
          <span ref={labelRef} className="font-semibold text-ink dark:text-bone">
            0%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden transition-colors duration-300">
          <div ref={fillRef} className="h-full w-0 rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}
