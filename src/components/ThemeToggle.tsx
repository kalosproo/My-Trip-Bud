"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* Storage may be disabled. */ }
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      aria-pressed={dark}
      className="shrink-0 w-11 h-11 rounded-full bg-black/5 dark:bg-white/10 text-ink dark:text-bone text-sm font-medium flex items-center justify-center transition-colors duration-300 ease-fluid active:scale-90"
    >
      {dark ? "☀" : "●"}
    </button>
  );
}
