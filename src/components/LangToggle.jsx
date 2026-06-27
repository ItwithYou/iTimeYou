export default function LangToggle({ lang, setLang }) {
  return (
    <button
      onClick={() => setLang(lang === 'lo' ? 'en' : 'lo')}
      className="px-2.5 py-1 rounded-full text-xs font-bold border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-150 select-none"
    >
      {lang === 'lo' ? 'ລາວ' : 'EN'}
    </button>
  );
}