/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Theme tối mặc định, tông đen xanh',
    preview: { bg: '#0a0e17', accent: '#10b981', card: '#111827', text: '#f1f5f9' },
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Tối xanh dương, lấy cảm hứng từ đại dương',
    preview: { bg: '#0b1224', accent: '#3b82f6', card: '#0f1d36', text: '#e0eaff' },
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    description: 'Tối xanh lá, mang cảm giác thiên nhiên',
    preview: { bg: '#0a1410', accent: '#34d399', card: '#0f1f18', text: '#d1fae5' },
  },
  {
    id: 'sunset',
    name: 'Sunset Purple',
    description: 'Tối tím, phong cách hoàng hôn',
    preview: { bg: '#110b1e', accent: '#a78bfa', card: '#1a1030', text: '#ede9fe' },
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Giao diện sáng, dễ nhìn ban ngày',
    preview: { bg: '#f8fafc', accent: '#10b981', card: '#ffffff', text: '#0f172a' },
  },
];

const STORAGE_KEY = 'codexa-theme';

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'midnight';
    } catch {
      return 'midnight';
    }
  });

  // Apply theme to <html> element
  const applyTheme = useCallback((themeId) => {
    document.documentElement.setAttribute('data-theme', themeId);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setTheme = useCallback((themeId) => {
    setThemeState(themeId);
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch { /* ignore */ }
  }, []);

  const value = {
    theme,
    setTheme,
    themes: THEMES,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export default ThemeContext;
