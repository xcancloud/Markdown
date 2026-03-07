import React from 'react';
import { useLocale } from '../context/MarkdownProvider';
import type { Locale } from '../i18n';

export interface LocaleSwitcherProps {
  className?: string;
}

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en-US', label: 'English' },
  { value: 'zh-CN', label: '中文' },
];

export const LocaleSwitcher: React.FC<LocaleSwitcherProps> = ({
  className = '',
}) => {
  const { locale, setLocale } = useLocale();

  return (
    <div className={`angus-locale-switcher ${className}`}>
      {LOCALE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={`locale-switcher-btn ${locale === opt.value ? 'active' : ''}`}
          onClick={() => setLocale(opt.value)}
          aria-label={opt.label}
          title={opt.label}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default LocaleSwitcher;
