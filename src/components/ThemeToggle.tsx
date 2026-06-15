import { useTheme } from '../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className={`neo-btn neo-btn-soft w-9 h-9 rounded-xl flex items-center justify-center ${className}`}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        /* Sun — click to go light */
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        /* Moon — click to go dark */
        <Moon className="w-4 h-4 text-slate-700" />
      )}
    </button>
  );
}
