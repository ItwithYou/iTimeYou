export default function TrustBadge({ stars, lang = 'en' }) {
  const level = stars >= 4.5 
    ? { en: 'Gold Trust', lo: 'ຄວາມໜ້າເຊື່ອຖືທອງ', cls: 'bg-amber-100 text-amber-700' }
    : stars >= 3.5 
    ? { en: 'Silver Trust', lo: 'ຄວາມໜ້າເຊື່ອຖືເງິນ', cls: 'bg-muted text-muted-foreground' }
    : { en: 'Bronze Trust', lo: 'ຄວາມໜ້າເຊື່ອຖືທອງແດງ', cls: 'bg-orange-100 text-orange-700' };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${level.cls}`}>
      {level[lang]} · {(stars || 0).toFixed(1)}
    </span>
  );
}