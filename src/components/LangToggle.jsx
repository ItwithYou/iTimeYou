export default function LangToggle({ lang, setLang }) {
  const isLao = lang === 'lo';

  return (
    <button
      onClick={() => setLang(isLao ? 'en' : 'lo')}
      title={isLao ? 'Switch to English' : 'ປ່ຽນເປັນພາສາລາວ'}
      className="
        relative flex items-center gap-1.5
        bg-muted border border-border
        rounded-full px-3 py-1
        text-xs font-bold
        hover:border-primary/50 hover:bg-primary/5
        transition-all duration-200 select-none
      "
    >
      {/* Animated dot indicator */}
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      {/* Show current lang label + hint of other */}
      <span className="text-foreground tracking-wide">
        {isLao ? 'ລາວ' : 'EN'}
      </span>
      <span className="text-muted-foreground/50">·</span>
      <span className="text-muted-foreground/60 font-medium">
        {isLao ? 'EN' : 'ລາວ'}
      </span>
    </button>
  );
}