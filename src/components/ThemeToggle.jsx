import { useState, useEffect } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';

const ORDER = ['light', 'dark', 'warm'];

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'warm');
  if (theme === 'dark') root.classList.add('dark');
  if (theme === 'warm') root.classList.add('warm');
  localStorage.setItem('theme', theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => { applyTheme(theme); }, [theme]);

  const next = () => setTheme((cur) => ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length]);

  const label = theme === 'dark' ? 'Dark' : theme === 'warm' ? 'Warm Gold' : 'Light';

  return (
    <button
      onClick={next}
      aria-label={`Theme: ${label}. Tap to change.`}
      title={`Theme: ${label}`}
      className="p-2 rounded-full hover:bg-muted transition-colors"
    >
      {theme === 'dark' ? (
        <Moon size={18} className="text-sky-300" />
      ) : theme === 'warm' ? (
        <Sparkles size={18} className="text-amber-500" />
      ) : (
        <Sun size={18} className="text-amber-400" />
      )}
    </button>
  );
}
