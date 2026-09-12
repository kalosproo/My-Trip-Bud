export default function TripIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
      <circle cx="94" cy="22" r="10" fill="none" stroke="#2563EB" strokeWidth="1.5" />
      <path
        d="M20 70 Q20 40 8 34 M20 70 Q20 42 34 32 M20 70 Q20 46 20 30"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M62 74 Q62 44 48 38 M62 74 Q62 46 78 36 M62 74 Q62 50 62 34"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <line x1="4" y1="78" x2="112" y2="78" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
    </svg>
  );
}
