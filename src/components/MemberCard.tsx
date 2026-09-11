import type { Member } from "@/lib/firebase";

export default function MemberCard({ member, share }: { member: Member; share: number }) {
  const pct = share > 0 ? Math.min(100, Math.round((member.totalSaved / share) * 100)) : 0;
  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-soft px-4 py-3 flex items-center gap-3">
      {member.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.photoURL} alt="" className="w-9 h-9 rounded-full" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold">
          {member.displayName.slice(0, 1)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{member.displayName}</p>
        <p className="text-xs text-slate">
          ₹{member.totalSaved.toLocaleString("en-IN")} / ₹{share.toLocaleString("en-IN")}
        </p>
      </div>
      <span className="text-xs font-semibold text-accent">{pct}%</span>
    </div>
  );
}
