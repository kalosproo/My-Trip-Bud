"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export default function Celebration({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  const burstRef = useRef<HTMLDivElement>(null);
  const dotColors = ["#2563EB", "#18181B", "#FAFAFA"];

  useEffect(() => {
    if (!burstRef.current) return;
    anime({
      targets: burstRef.current.children,
      translateX: () => anime.random(-140, 140),
      translateY: () => anime.random(-160, -20),
      scale: [0, 1],
      opacity: [1, 0],
      duration: 1100,
      delay: anime.stagger(15),
      easing: "easeOutCubic",
    });
  }, []);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 dark:bg-black/60 px-4">
      <div className="relative rounded-[2rem] bg-white dark:bg-panel shadow-soft dark:shadow-soft-dark px-8 py-10 max-w-xs w-full text-center">
        <div ref={burstRef} className="absolute left-1/2 top-10 pointer-events-none">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: dotColors[i % dotColors.length],
                left: "50%",
                top: "0%",
                marginLeft: "-4px",
                marginTop: "-4px",
              }}
            />
          ))}
        </div>
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-ink dark:bg-bone flex items-center justify-center text-bone dark:text-ink">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-display text-xl text-ink dark:text-bone mb-2">{message}</p>
        <p className="text-xs text-slate dark:text-bone/60 mb-6">Every friend chipped in — the fund is fully saved.</p>
        <button
          onClick={onClose}
          className="rounded-full bg-ink dark:bg-bone px-6 py-2.5 text-sm font-medium text-bone dark:text-ink transition-transform duration-300 ease-fluid active:scale-[0.98]"
        >
          Nice!
        </button>
      </div>
    </div>
  );
}
