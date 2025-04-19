import React, { createContext, useContext, useEffect, useState } from 'react';
import { darkTheme, lightTheme, Theme, generateCSSVariables } from './tokens/theme';

// Define theme context type
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  isDarkMode: boolean;
}

// Create theme context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  setTheme: () => {},
  isDarkMode: false,
});

// Theme provider props
interface ThemeProviderProps {
  defaultTheme?: 'light' | 'dark' | 'system';
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  defaultTheme = 'system',
  children,
}) => {
  // State for current theme mode
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(
    () => {
      // Try to load from localStorage first
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
      return savedTheme || defaultTheme;
    }
  );
  
  // State for system preference
  const [systemIsDark, setSystemIsDark] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  // Determine actual theme based on mode and system preference
  const isDarkMode = themeMode === 'system' 
    ? systemIsDark 
    : themeMode === 'dark';
  
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    
    // Add event listener for theme changes
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  // Update localStorage and document classes when theme changes
  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('theme', themeMode);
    
    // Set dark mode class on document
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    // Apply CSS variables directly to :root
    const cssVars = generateCSSVariables(theme);
    root.style.cssText = cssVars;
    
  }, [theme, themeMode, isDarkMode]);
  
  // Handler to set theme
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeMode(newTheme);
  };
  
  const value = {
    theme,
    setTheme,
    isDarkMode,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}; 