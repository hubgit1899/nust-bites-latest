"use client";

import { createContext, useEffect, useState } from "react";
import { getThemes, DEFAULT_LIGHT, DEFAULT_DARK } from "@/lib/theme";

export const ThemeContext = createContext({
  theme: DEFAULT_LIGHT,
  toggleTheme: () => {},
  themeConfig: { light: DEFAULT_LIGHT, dark: DEFAULT_DARK }, // ✅ new
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<string | null>(null);
  const [themeConfig, setThemeConfig] = useState<{
    light: string;
    dark: string;
  }>({
    light: DEFAULT_LIGHT,
    dark: DEFAULT_DARK,
  });

  useEffect(() => {
    const initTheme = async () => {
      const { LIGHT_THEME, DARK_THEME } = await getThemes();

      setThemeConfig({
        light: LIGHT_THEME,
        dark: DARK_THEME,
      });

      const storedTheme = localStorage.getItem("theme");
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      let initialTheme = storedTheme;

      // ✅ Validate stored theme
      if (storedTheme !== LIGHT_THEME && storedTheme !== DARK_THEME) {
        initialTheme = systemPrefersDark ? DARK_THEME : LIGHT_THEME;
        localStorage.setItem("theme", initialTheme!);
      }

      setTheme(initialTheme || LIGHT_THEME);

      const appliedTheme = initialTheme || LIGHT_THEME;
      document.documentElement.setAttribute("data-theme", appliedTheme);
      document.documentElement.classList.add(appliedTheme);
    };

    initTheme();
  }, []);

  const toggleTheme = () => {
    if (!theme) return;
    const newTheme =
      theme === themeConfig.dark ? themeConfig.light : themeConfig.dark;

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    document.documentElement.classList.remove(
      themeConfig.light,
      themeConfig.dark
    );
    document.documentElement.classList.add(newTheme);
  };

  if (!theme) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}
