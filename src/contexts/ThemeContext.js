import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  dark: {
    background: '#000000',
    surface: '#1a1a1a',
    surfaceGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    text: '#ffffff',
    textSecondary: '#cccccc',
    border: '#404040',
    borderLight: '#333333',
    accent: '#ffffff',
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff4444'
  },
  light: {
    background: '#ffffff',
    surface: '#f8f9fa',
    surfaceGradient: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    text: '#000000',
    textSecondary: '#666666',
    border: '#dee2e6',
    borderLight: '#e9ecef',
    accent: '#000000',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545'
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-tatuape');
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme-tatuape', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme: themes[theme], themeName: theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};