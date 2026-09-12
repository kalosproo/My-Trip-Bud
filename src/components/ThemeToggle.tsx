"use client";

import { useLayoutEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // useLayoutEffect runs before the browser paints, so the icon is correct
  // on first paint instead of flashing ● → ☀ (or the reverse) after mount.
  useLayoutEffect(() => {
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
      className="fixed top-[calc(env(safe-area-inset-top,0px)+1rem)] right-4 z-20 w-11 h-11 rounded-full bg-black/5 dark:bg-white/10 text-ink dark:text-bone text-sm font-medium flex items-center justify-center transition-colors duration-300 ease-fluid active:scale-90"
    >
      {dark ? "☀" : "●"}
    </button>
  );
}
