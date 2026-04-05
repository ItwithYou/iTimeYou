export default function VerificationBadge({ status, t }) {
  if (status === 'verified') {
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{t.verStatus}</span>;
  }
  if (status === 'pending') {
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{t.verPending}</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground">{t.notVerified}</span>;
}