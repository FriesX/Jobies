'use client';

import * as React from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeProviderState>({
  theme: 'system',
  setTheme: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'job-search-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme);

  React.useEffect(() => {
    const saved = localStorage.getItem(storageKey) as Theme | null;
    if (saved) {
      setTheme(saved);
    } else {
      setTheme(defaultTheme);
    }
  }, [defaultTheme, storageKey]);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (t: Theme) => {
      localStorage.setItem(storageKey, t);
      setTheme(t);
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
