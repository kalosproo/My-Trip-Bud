"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export default function Celebration({ message, onClose }: { message: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.showModal();
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const targets = Array.from(burstRef.current?.children ?? []);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      anime({ targets, translateX: () => anime.random(-100, 100), translateY: () => anime.random(-80, -20), scale: [0, 1], opacity: [1, 0], duration: 1100, delay: anime.stagger(15), easing: "easeOutCubic" });
    }
    return () => {
      anime.remove(targets);
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  return <dialog ref={dialogRef} aria-labelledby="celebration-title" aria-describedby="celebration-description" onCancel={(event) => { event.preventDefault(); onClose(); }} className="w-[calc(100%-2rem)] max-w-xs rounded-[2rem] bg-white dark:bg-panel text-ink dark:text-bone px-8 py-10 text-center shadow-soft backdrop:bg-black/50">
    <div ref={burstRef} aria-hidden="true" className="absolute left-1/2 top-20 pointer-events-none">
      {Array.from({ length: 18 }, (_, index) => <span key={index} className={`absolute w-2 h-2 rounded-full opacity-0 ${["bg-blue-600 dark:bg-blue-400", "bg-amber-600 dark:bg-amber-400", "bg-emerald-600 dark:bg-emerald-400"][index % 3]}`} />)}
    </div>
    <div aria-hidden="true" className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent text-white flex items-center justify-center text-2xl">✓</div>
    <h2 id="celebration-title" className="font-display text-xl mb-2">{message}</h2>
    <p id="celebration-description" className="text-sm text-slate dark:text-bone/70 mb-6">Your trip fund is fully saved. Time to plan the adventure!</p>
    <button ref={closeRef} onClick={onClose} className="rounded-full bg-ink dark:bg-bone text-bone dark:text-ink px-6 py-3">Nice!</button>
  </dialog>;
}
