import React, { createContext, useContext, useState, useEffect } from "react";

export type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  isDarkMode: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("janvani_theme");
      if (saved === "light" || saved === "dark") {
        return saved as Theme;
      }
      // Default to light mode as requested by the user
      return "light";
    }
    return "light";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("janvani_theme", theme);
      } catch (e) {
        // ignore storage errors
      }
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
        document.body.classList.add("dark");
      } else {
        root.classList.remove("dark");
        document.body.classList.remove("dark");
      }
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const isDarkMode = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
