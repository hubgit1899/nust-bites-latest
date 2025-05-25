// ThemeProvider.tsx
"use client";

import { createContext, useEffect, useState } from "react";
import { getThemes, DEFAULT_LIGHT, DEFAULT_DARK } from "@/lib/theme";

export const ThemeContext = createContext({
  theme: DEFAULT_LIGHT, // Initial React context theme
  toggleTheme: () => {},
  themeConfig: { light: DEFAULT_LIGHT, dark: DEFAULT_DARK },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize theme state. This is what React components will see initially from context.
  // The inline script handles the *visual* theme on the DOM even before this component hydrates.
  // This might momentarily differ from the DOM if inline script chose dark, but will sync in useEffect.
  const [theme, setTheme] = useState<string>(DEFAULT_LIGHT);
  const [themeConfig, setThemeConfig] = useState<{
    light: string;
    dark: string;
  }>({
    light: DEFAULT_LIGHT,
    dark: DEFAULT_DARK,
  });

  useEffect(() => {
    const initTheme = async () => {
      let effectiveLightTheme = DEFAULT_LIGHT;
      let effectiveDarkTheme = DEFAULT_DARK;

      // 1. Fetch actual theme names (could be different from DEFAULT_LIGHT/DARK if customized in DB)
      try {
        const themesFromDB = await getThemes();
        effectiveLightTheme = themesFromDB.LIGHT_THEME;
        effectiveDarkTheme = themesFromDB.DARK_THEME;

        setThemeConfig({
          // Update themeConfig with fetched/resolved values
          light: effectiveLightTheme,
          dark: effectiveDarkTheme,
        });
      } catch (error) {
        console.error(
          "ThemeProvider: Failed to fetch dynamic themes, using defaults configured at init.",
          error
        );
        // themeConfig state will retain its initial DEFAULT_LIGHT/DARK
        // effectiveLightTheme/DarkTheme will be the initial DEFAULT_LIGHT/DARK
      }

      // 2. Determine the target theme based on localStorage, system preference, and actual theme names
      const storedTheme = localStorage.getItem("theme");
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      let chosenTheme: string;

      // Validate stored theme against the (potentially updated) effective themes
      if (
        storedTheme &&
        (storedTheme === effectiveLightTheme ||
          storedTheme === effectiveDarkTheme)
      ) {
        chosenTheme = storedTheme;
      } else {
        // If no valid stored theme, use system preference with effective themes
        chosenTheme = systemPrefersDark
          ? effectiveDarkTheme
          : effectiveLightTheme;
      }

      // 3. Reconcile with the current DOM state
      // The inline script might have already set a theme (e.g., DEFAULT_LIGHT or DEFAULT_DARK).
      // We need to ensure the DOM reflects the final `chosenTheme`.
      const themeAppliedByInlineScript =
        document.documentElement.getAttribute("data-theme");

      // If the theme applied by inline script is different from our final chosenTheme, remove the old class.
      // The inline script specifically uses DEFAULT_LIGHT or DEFAULT_DARK for class names.
      if (
        themeAppliedByInlineScript &&
        themeAppliedByInlineScript !== chosenTheme
      ) {
        if (
          themeAppliedByInlineScript === DEFAULT_LIGHT ||
          themeAppliedByInlineScript === DEFAULT_DARK
        ) {
          document.documentElement.classList.remove(themeAppliedByInlineScript);
        } else {
          // Fallback if inline script somehow set a different class (unlikely given the script)
          // This is less critical if data-theme is the primary selector for styles.
          document.documentElement.classList.remove(themeAppliedByInlineScript);
        }
      }

      // Apply the final chosen theme's attribute and class
      document.documentElement.setAttribute("data-theme", chosenTheme);
      // Add the chosenTheme class if it's not already there (it might be if inline script guessed correctly
      // AND chosenTheme is one of DEFAULT_LIGHT/DARK)
      if (!document.documentElement.classList.contains(chosenTheme)) {
        document.documentElement.classList.add(chosenTheme);
      }

      // 4. Persist and update React state
      localStorage.setItem("theme", chosenTheme); // Persist the truly active theme
      setTheme(chosenTheme); // Update React state and context
    };

    initTheme();
  }, []); // Runs once on mount

  const toggleTheme = () => {
    if (!theme) return; // Should not happen with initialized theme state
    const newTheme =
      theme === themeConfig.dark ? themeConfig.light : themeConfig.dark;

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    // Remove all configured theme classes before adding the new one
    document.documentElement.classList.remove(
      themeConfig.light,
      themeConfig.dark
    );
    document.documentElement.classList.add(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}
