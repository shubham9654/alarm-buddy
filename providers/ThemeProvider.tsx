import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../state/settingsStore';
import { Settings } from '../models/settings';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Settings['theme']) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { settings, updateSettings } = useSettingsStore();
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('light');

  // Determine the actual theme based on settings and system preference
  useEffect(() => {
    let resolvedTheme: ThemeMode;
    
    switch (settings.theme) {
      case 'dark':
        resolvedTheme = 'dark';
        break;
      case 'light':
        resolvedTheme = 'light';
        break;
      case 'system':
      default:
        resolvedTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
        break;
    }
    
    setCurrentTheme(resolvedTheme);
  }, [settings.theme, systemColorScheme]);

  const toggleTheme = () => {
    const nextTheme: Settings['theme'] = 
      settings.theme === 'light' ? 'dark' : 
      settings.theme === 'dark' ? 'system' : 'light';
    
    updateSettings({ theme: nextTheme });
  };

  const setTheme = (theme: Settings['theme']) => {
    updateSettings({ theme });
  };

  const contextValue: ThemeContextType = {
    theme: currentTheme,
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light',
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme-aware styles helper
export const createThemedStyles = <T extends Record<string, any>>(
  lightStyles: T,
  darkStyles: Partial<T> = {}
) => {
  return (theme: ThemeMode): T => {
    if (theme === 'dark') {
      return { ...lightStyles, ...darkStyles };
    }
    return lightStyles;
  };
};

// Common theme colors
export const themeColors = {
  light: {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    secondary: '#6B7280',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  dark: {
    primary: '#60A5FA',
    primaryDark: '#3B82F6',
    secondary: '#9CA3AF',
    background: '#111827',
    surface: '#1F2937',
    card: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#4B5563',
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    info: '#60A5FA',
  },
};

// Hook to get theme colors
export const useThemeColors = () => {
  const { theme } = useTheme();
  return themeColors[theme];
};

// Tailwind class helper for theme-aware styling
export const getThemeClass = (lightClass: string, darkClass: string, theme: ThemeMode) => {
  return theme === 'dark' ? darkClass : lightClass;
};

// Hook for theme-aware Tailwind classes
export const useThemeClass = (lightClass: string, darkClass: string) => {
  const { theme } = useTheme();
  return getThemeClass(lightClass, darkClass, theme);
};