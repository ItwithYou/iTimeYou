import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Apply saved theme (light / dark / warm). Fall back to OS preference.
(() => {
  const saved = localStorage.getItem('theme');
  const root = document.documentElement;
  root.classList.remove('dark', 'warm');
  if (saved === 'dark') root.classList.add('dark');
  else if (saved === 'warm') root.classList.add('warm');
  else if (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)