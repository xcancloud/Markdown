import React from 'react';
import { useTheme, type ThemeMode } from '../context/MarkdownProvider';
import { useLocale } from '../context/MarkdownProvider';

export interface ThemeSwitcherProps {
  className?: string;
}

const THEME_OPTIONS: ThemeMode[] = ['light', 'dark', 'auto'];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  className = '',
}) => {
  const { theme, setTheme } = useTheme();
  const { messages } = useLocale();

  const themeLabels: Record<ThemeMode, string> = {
    light: messages.theme.light,
    dark: messages.theme.dark,
    auto: messages.theme.auto,
  };

  return (
    <div className={`angus-theme-switcher ${className}`}>
      {THEME_OPTIONS.map((t) => (
        <button
          key={t}
          className={`theme-switcher-btn ${theme === t ? 'active' : ''}`}
          onClick={() => setTheme(t)}
          aria-label={themeLabels[t]}
          title={themeLabels[t]}
        >
          {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}
          <span className="theme-switcher-label">{themeLabels[t]}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
