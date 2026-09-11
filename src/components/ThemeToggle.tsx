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
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="fixed top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 text-ink dark:text-bone text-xs font-medium flex items-center justify-center transition-transform duration-300 ease-fluid active:scale-90"
    >
      {dark ? "☀" : "●"}
    </button>
  );
}
