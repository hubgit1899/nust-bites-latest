"use client";

import { useContext } from "react";
import { ThemeContext } from "@/app/context/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme, themeConfig } = useContext(ThemeContext);

  return (
    <div>
      <label className="toggle text-base-content scale-140">
        <input
          type="checkbox"
          className="theme-controller border-0"
          onChange={toggleTheme}
          checked={theme === themeConfig.dark}
        />

        {/* Sun icon (Light Mode) */}
        <svg
          aria-label="sun"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={theme === themeConfig.dark ? "hidden" : "block"}
        >
          <g
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="2"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="m4.93 4.93 1.41 1.41"></path>
            <path d="m17.66 17.66 1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="m6.34 17.66-1.41 1.41"></path>
            <path d="m19.07 4.93-1.41 1.41"></path>
          </g>
        </svg>

        {/* Moon icon (Dark Mode) */}
        <svg
          aria-label="moon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={theme === themeConfig.dark ? "block" : "hidden"}
        >
          <g
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="2"
            fill="none"
            stroke="currentColor"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
          </g>
        </svg>
      </label>
    </div>
  );
}
