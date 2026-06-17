import { createContext, useContext, useState, useCallback } from 'react';

export const LIGHT = {
  pageBg:      '#F8F9FB',
  cardBg:      '#FFFFFF',
  headerBg:    '#FFFFFF',
  border:      '#F0F0F0',
  borderMed:   '#E5E7EB',
  text:        '#111827',
  textMed:     '#374151',
  textSub:     '#6B7280',
  textMuted:   '#9CA3AF',
  inputBg:     '#FFFFFF',
  inputBorder: '#E5E7EB',
  hoverBg:     '#F9FAFB',
  tagBg:       '#F3F4F6',
};

export const DARK = {
  pageBg:      '#0D0D1A',
  cardBg:      '#1C1C2E',
  headerBg:    '#13132B',
  border:      'rgba(255,255,255,0.08)',
  borderMed:   'rgba(255,255,255,0.13)',
  text:        '#F1F1F1',
  textMed:     '#D1D5DB',
  textSub:     '#9CA3AF',
  textMuted:   '#6B7280',
  inputBg:     '#252545',
  inputBorder: 'rgba(255,255,255,0.15)',
  hoverBg:     '#252545',
  tagBg:       '#252545',
};

const ThemeContext = createContext({ isDark: false, toggleDark: () => {}, theme: LIGHT });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('priorit_dark') === 'true');

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('priorit_dark', String(next));
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, theme: isDark ? DARK : LIGHT }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
