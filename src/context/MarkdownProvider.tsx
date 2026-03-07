import React, { createContext, useContext, useState, useCallback } from 'react';
import { type Locale, type I18nMessages, getMessages } from '../i18n';

// ============================================================
// Theme Context
// ============================================================
export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'auto',
  setTheme: () => {},
  resolvedTheme: 'light',
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ============================================================
// Locale Context
// ============================================================
interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: I18nMessages;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en-US',
  setLocale: () => {},
  messages: getMessages('en-US'),
});

export function useLocale() {
  return useContext(LocaleContext);
}

// ============================================================
// Combined Provider
// ============================================================
export interface MarkdownProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  defaultLocale?: Locale;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export const MarkdownProvider: React.FC<MarkdownProviderProps> = ({
  children,
  defaultTheme = 'auto',
  defaultLocale = 'en-US',
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    getSystemTheme,
  );

  // Listen to system theme changes
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((t: ThemeMode) => setThemeState(t), []);
  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const resolvedTheme = theme === 'auto' ? systemTheme : theme;
  const messages = getMessages(locale);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      <LocaleContext.Provider value={{ locale, setLocale, messages }}>
        {children}
      </LocaleContext.Provider>
    </ThemeContext.Provider>
  );
};
