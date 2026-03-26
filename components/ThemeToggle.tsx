"use client";

import type { ThemeMode } from "@/hooks/useTheme";

type ThemeToggleProps = {
  theme: ThemeMode;
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
