import { createContext, useContext, useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";
type AccentColor = "#4A2C3F" | "#2563EB" | "#059669" | "#D97706" | "#DC2626" | "#7C3AED";

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (t: Theme) => void;
  setAccentColor: (c: AccentColor) => void;
}

const ThemeCtx = createContext<ThemeContextType>({
  theme: "dark",
  accentColor: "#4A2C3F",
  setTheme: () => {},
  setAccentColor: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("hr_theme") as Theme) || "dark";
  });
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (localStorage.getItem("hr_accent") as AccentColor) || "#4A2C3F";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light-theme");
      root.classList.remove("dark-theme");
    } else {
      root.classList.add("dark-theme");
      root.classList.remove("light-theme");
    }
    root.style.setProperty("--accent-color", accentColor);
    root.style.setProperty("--accent-hover", accentColor + "CC");
  }, [theme, accentColor]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("hr_theme", t);
  }, []);

  const setAccentColor = useCallback((c: AccentColor) => {
    setAccentColorState(c);
    localStorage.setItem("hr_accent", c);
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, accentColor, setTheme, setAccentColor }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
