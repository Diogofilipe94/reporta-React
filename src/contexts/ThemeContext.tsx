import React, { createContext, useState, useEffect, useContext } from 'react';

// Define the color palette
const palette = {
  // Base colors
  black: '#000000',
  white: '#FFFFFF',
  // Main color scheme
  primary: '#545333', // Dark olive green
  secondary: '#878672', // Medium olive green
  third: '#d9d7b6', // Light beige
  fourth: '#fdfbd4', // Very light beige
  // Gray tones for dark mode
  gray900: '#121212', // Almost black
  gray800: '#1e1e1e', // Very dark gray
  gray700: '#2c2c2c', // Dark gray
  gray600: '#383838', // Medium-dark gray
  gray500: '#505050', // Medium gray
  gray400: '#707070', // Medium-light gray
  gray300: '#909090', // Light gray
  gray200: '#b0b0b0', // Very light gray
  // Status colors
  danger: '#e74c3c', // Red
  warning: '#f39c12', // Orange
  success: '#27ae60', // Green
};

// Define theme objects for light and dark modes
export const theme = {
  light: {
    background: palette.white,
    surface: palette.white,
    card: palette.secondary,
    errorBackground: '#ffebee',
    textPrimary: palette.primary,
    textSecondary: palette.secondary,
    textTertiary: palette.white,
    textBlack: palette.black,
    primary: palette.secondary,
    secondary: palette.primary,
    accent: palette.white,
    error: palette.danger,
    warning: palette.warning,
    success: palette.success,
    border: palette.black,
    divider: palette.primary,
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    background: palette.gray700,
    surface: palette.gray800,
    card: palette.gray700,
    errorBackground: '#421c1c',
    textPrimary: palette.fourth,
    textSecondary: palette.third,
    textTertiary: palette.gray700,
    textBlack: palette.white,
    primary: palette.third,
    secondary: palette.primary,
    accent: palette.fourth,
    error: '#ff6b6b',
    warning: '#ffb142',
    success: '#58d68d',
    border: palette.third,
    divider: palette.gray600,
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

// Define the theme context type
type ThemeContextType = {
  colors: typeof theme.light;
  isDark: boolean;
  setColorScheme: (scheme: 'light' | 'dark') => void;
};

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
  colors: theme.light,
  isDark: false,
  setColorScheme: () => {},
});

// Theme provider component
export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Check for user's preferred color scheme
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  // State to store the current color scheme
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(
    localStorage.getItem('theme') as 'light' | 'dark' || (prefersDark ? 'dark' : 'light')
  );

  // Apply theme to document when it changes
  useEffect(() => {
    // Update the data-theme attribute on the document
    document.documentElement.setAttribute('data-theme', colorScheme);

    // Apply theme-specific CSS variables
    const currentTheme = theme[colorScheme];
    Object.entries(currentTheme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });

    // Store the theme preference
    localStorage.setItem('theme', colorScheme);
  }, [colorScheme]);

  // Function to change the theme
  const changeColorScheme = (scheme: 'light' | 'dark') => {
    setColorScheme(scheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        colors: theme[colorScheme],
        isDark: colorScheme === 'dark',
        setColorScheme: changeColorScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use the theme in components
export const useTheme = () => useContext(ThemeContext);
