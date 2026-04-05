export default function LangToggle({ lang, setLang }) {
  return (
    <div className="flex gap-0.5 bg-muted rounded-full p-0.5 border border-border">
      <button
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
          lang === 'en'
            ? 'bg-gradient-to-r from-tiffany to-deep-green text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('lo')}
        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all font-lao ${
          lang === 'lo'
            ? 'bg-gradient-to-r from-tiffany to-deep-green text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        ລາວ
      </button>
    </div>
  );
}