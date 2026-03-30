import React, { createContext, useContext, useState, useCallback } from 'react';
import { type Locale, type I18nMessages, getMessages } from '../i18n';

// ============================================================
// Theme Mode — 亮暗模式
// ============================================================
export type ThemeMode = 'light' | 'dark' | 'auto';

// ============================================================
// Theme Variant — 皮肤（决定使用哪套 CSS 变量）
// default → markdown-theme-{light|dark}
// angus   → markdown-theme-angus / markdown-theme-angus-dark
// github  → markdown-theme-github / markdown-theme-github-dark
// ============================================================
export type ThemeVariant = 'default' | 'angus' | 'github';

/** 根据皮肤和解析后的亮暗模式生成 CSS 类名 */
export function resolveThemeClass(
  variant: ThemeVariant,
  mode: 'light' | 'dark',
): string {
  if (variant === 'default') return `markdown-theme-${mode}`;
  return mode === 'light'
    ? `markdown-theme-${variant}`
    : `markdown-theme-${variant}-dark`;
}

// ============================================================
// Theme Context
// ============================================================
interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  variant: ThemeVariant;
  setVariant: (variant: ThemeVariant) => void;
  /** auto 时解析为系统 light/dark */
  resolvedMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'auto',
  setTheme: () => {},
  variant: 'angus',
  setVariant: () => {},
  resolvedMode: 'light',
});

export function useTheme() {
  return useContext(ThemeContext);
}

// 向后兼容：旧代码使用 resolvedTheme，这里做个别名
export function useResolvedTheme() {
  const { resolvedMode } = useTheme();
  return resolvedMode;
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
  /** 皮肤，默认 'angus' */
  defaultVariant?: ThemeVariant;
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
  defaultVariant = 'angus',
  defaultLocale = 'en-US',
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [variant, setVariantState] = useState<ThemeVariant>(defaultVariant);
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    getSystemTheme,
  );

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((t: ThemeMode) => setThemeState(t), []);
  const setVariant = useCallback((v: ThemeVariant) => setVariantState(v), []);
  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const resolvedMode: 'light' | 'dark' =
    theme === 'auto' ? systemTheme : theme;
  const messages = getMessages(locale);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, variant, setVariant, resolvedMode }}
    >
      <LocaleContext.Provider value={{ locale, setLocale, messages }}>
        {children}
      </LocaleContext.Provider>
    </ThemeContext.Provider>
  );
};
