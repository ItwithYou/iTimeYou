export default function LangToggle({ lang, setLang }) {
  return (
    <div className="flex gap-0.5 bg-muted rounded-full p-0.5">
      <button
        onClick={() => setLang('en')}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${lang === 'en' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('lo')}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all font-lao ${lang === 'lo' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
      >
        ລາວ
      </button>
    </div>
  );
}