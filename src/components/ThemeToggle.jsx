import { useState, useEffect } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'gold');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'gold') {
      document.documentElement.classList.add('gold');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('gold');
    else setTheme('light');
  };

  return (
    <button
      onClick={cycleTheme}
      aria-label="Toggle theme"
      className="p-2 rounded-full hover:bg-muted transition-colors flex items-center justify-center"
    >
      {theme === 'dark' ? (
        <Moon size={18} className="text-indigo-300" />
      ) : theme === 'gold' ? (
        <Sparkles size={18} className="text-amber-600" />
      ) : (
        <Sun size={18} className="text-amber-500" />
      )}
    </button>
  );
}