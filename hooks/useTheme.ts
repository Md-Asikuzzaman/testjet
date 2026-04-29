"use client";

import { useCallback, useEffect } from "react";

import { usePersistentState } from "@/hooks/usePersistentState";

export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "test-generator-theme";

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = usePersistentState<ThemeMode>(
    THEME_STORAGE_KEY,
    resolveInitialTheme(),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, [setTheme]);

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
