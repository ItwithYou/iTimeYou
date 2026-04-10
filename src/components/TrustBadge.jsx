export default function TrustBadge({ stars, lang = 'en' }) {
  const level = stars >= 4.5
    ? { en: 'Gold Trust', lo: 'ຄວາມໜ້າເຊື່ອຖືທອງ', cls: 'bg-amber-100 text-amber-700 border-amber-300', dot: 'bg-amber-400' }
    : stars >= 3.5
    ? { en: 'Silver Trust', lo: 'ຄວາມໜ້າເຊື່ອຖືເງິນ', cls: 'bg-slate-100 text-slate-600 border-slate-300', dot: 'bg-slate-400' }
    : { en: 'Bronze Trust', lo: 'ຄວາມໜ້າເຊື່ອຖືທອງແດງ', cls: 'bg-orange-100 text-orange-700 border-orange-300', dot: 'bg-orange-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border shadow-sm ${level.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${level.dot}`} />
      {level[lang]} · {(stars || 0).toFixed(1)}
    </span>
  );
}