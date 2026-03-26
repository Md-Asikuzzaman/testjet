"use client";

import { useEffect } from "react";

import { ActionBar } from "@/components/ActionBar";
import { EditorPanel } from "@/components/EditorPanel";
import { OutputPanel } from "@/components/OutputPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useTestGenerator } from "@/hooks/useTestGenerator";
import { useTheme } from "@/hooks/useTheme";

const starterComponent = `type GreetingCardProps = {
  name: string;
  isLoading?: boolean;
  onRefresh?: () => void;
};

export function GreetingCard({
  name,
  isLoading = false,
  onRefresh,
}: GreetingCardProps) {
  if (isLoading) {
    return <p role="status">Loading profile...</p>;
  }

  if (!name) {
    return <p role="alert">Name is required.</p>;
  }

  return (
    <section>
      <h2>Hello, {name}</h2>
      <button onClick={onRefresh}>Refresh</button>
    </section>
  );
}`;

export default function Home() {
  const [sourceCode, setSourceCode] = usePersistentState<string>(
    "test-generator-source-code",
    starterComponent,
  );
  const { generated, isLoading, error, generate, debounceMs } =
    useTestGenerator();
  const { theme, toggleTheme } = useTheme();

  const onGenerate = () => {
    generate(sourceCode);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const hasShortcut =
        (event.ctrlKey || event.metaKey) && event.key === "Enter";

      if (!hasShortcut) {
        return;
      }

      event.preventDefault();
      generate(sourceCode);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [generate, sourceCode]);

  return (
    <main className="relative flex-1 overflow-hidden px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-350 flex-col">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              AI Powered Test Generator
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              TestJet - Supercharge Your Testing with AI
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Generate robust test suites, cleaner components, and actionable
              quality insights.
            </p>
          </div>

          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>

        <ActionBar onGenerate={onGenerate} isLoading={isLoading} />

        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
          <span>Shortcut: Ctrl/Cmd + Enter to generate</span>
          <span>Debounce: {debounceMs}ms</span>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-[var(--error)]/40 bg-[var(--error-soft)] px-4 py-3 text-sm text-[var(--error)]"
          >
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <EditorPanel value={sourceCode} onChange={setSourceCode} />
          <OutputPanel generated={generated} theme={theme} />
        </div>
      </div>
    </main>
  );
}
