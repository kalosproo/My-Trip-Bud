import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600"],
});
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "My Trip Bud — save for trips together",
  description: "Set a trip goal, split it with friends, watch the fund fill up.",
};

// Sets the dark/light class before paint so there's no flash of the wrong theme.
const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem("theme");
    var dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${display.variable} ${sans.variable} font-sans relative min-h-[100dvh] w-full overflow-x-hidden bg-bone dark:bg-ink transition-colors duration-300`}
      >
        <div className="grain" />
        <ThemeToggle />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
