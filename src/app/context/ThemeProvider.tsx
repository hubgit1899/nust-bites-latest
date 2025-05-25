"use client";

import { createContext, useEffect, useState } from "react";
import { getThemes, DEFAULT_LIGHT, DEFAULT_DARK } from "@/lib/theme";

export const ThemeContext = createContext({
  theme: DEFAULT_LIGHT,
  toggleTheme: () => {},
  themeConfig: { light: DEFAULT_LIGHT, dark: DEFAULT_DARK },
});

// Simple loading component
function ThemeLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 flex items-center justify-center">
      <span className="loading loading-bars loading-lg"></span>
    </div>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<string>(DEFAULT_LIGHT);
  const [themeConfig, setThemeConfig] = useState<{
    light: string;
    dark: string;
  }>({
    light: DEFAULT_LIGHT,
    dark: DEFAULT_DARK,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initTheme = async () => {
      try {
        // Set immediate theme for initial render
        const storedTheme = localStorage.getItem("theme");
        const systemPrefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;

        const immediateTheme =
          storedTheme || (systemPrefersDark ? DEFAULT_DARK : DEFAULT_LIGHT);
        setTheme(immediateTheme);
        document.documentElement.setAttribute("data-theme", immediateTheme);
        document.documentElement.classList.add(immediateTheme);

        // Fetch DB themes
        const { LIGHT_THEME, DARK_THEME } = await getThemes();

        setThemeConfig({
          light: LIGHT_THEME,
          dark: DARK_THEME,
        });

        // Validate and update
        let finalTheme: string;
        if (
          !storedTheme ||
          (storedTheme !== LIGHT_THEME && storedTheme !== DARK_THEME)
        ) {
          finalTheme = systemPrefersDark ? DARK_THEME : LIGHT_THEME;
          localStorage.setItem("theme", finalTheme);
        } else {
          finalTheme = storedTheme;
        }

        const appliedTheme = finalTheme;

        if (appliedTheme !== immediateTheme) {
          setTheme(appliedTheme);
          document.documentElement.setAttribute("data-theme", appliedTheme);
          document.documentElement.classList.remove(immediateTheme);
          document.documentElement.classList.add(appliedTheme);
        }
      } catch (error) {
        console.error("Failed to initialize theme:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initTheme();
  }, []);

  const toggleTheme = () => {
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

  if (isLoading) {
    return <ThemeLoading />;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}
