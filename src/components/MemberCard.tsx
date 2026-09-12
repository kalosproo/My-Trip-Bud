import type { Member } from "@/lib/firebase";

export default function MemberCard({ member, share }: { member: Member; share: number }) {
  const pct = share > 0 ? Math.min(100, Math.round((member.totalSaved / share) * 100)) : 0;
  const reached = share > 0 && member.totalSaved >= share;

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-panel ring-1 ring-black/5 dark:ring-white/10 shadow-soft dark:shadow-soft-dark px-4 py-3 flex items-center gap-3 transition-colors duration-300">
      {member.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.photoURL} alt="" className="w-9 h-9 rounded-full shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-semibold text-ink dark:text-bone shrink-0 transition-colors duration-300">
          {member.displayName.slice(0, 1)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink dark:text-bone truncate transition-colors duration-300">{member.displayName}</p>
        <p className="text-xs text-slate dark:text-bone/60 transition-colors duration-300">
          ₹{member.totalSaved.toLocaleString("en-IN")} / ₹{share.toLocaleString("en-IN")}
        </p>
        <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden mt-1.5 transition-colors duration-300">
          <div className="h-full rounded-full bg-accent transition-all duration-500 ease-fluid" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {reached ? (
        <span className="shrink-0 rounded-full bg-accent/10 dark:bg-accent/20 text-accent text-[11px] font-semibold px-2.5 py-1 transition-colors duration-300">
          Reached ✓
        </span>
      ) : (
        <span className="text-xs font-semibold text-accent shrink-0">{pct}%</span>
      )}
    </div>
  );
}
