"use client";

import { useMemo } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";

type EditorPanelProps = {
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
};

export function EditorPanel({ value, onChange, isLoading }: EditorPanelProps) {
  const lineCount = useMemo(() => value.split("\n").length, [value]);
  const charCount = useMemo(() => value.length, [value]);

  return (
    <section className="panel-surface relative flex h-[560px] flex-col overflow-hidden p-4 md:p-5">
      <div
        className={`editor-top-bar pointer-events-none absolute inset-x-0 top-0 h-1 ${
          isLoading ? "editor-loading-bar" : ""
        }`}
      />

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Component Input
        </h2>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={!value}
            className="cursor-pointer rounded-full border border-[var(--line)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
            React / Next.js
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            Paste component
          </span>
        </div>
      </div>

      <div className="code-editor-surface relative h-full min-h-0 w-full overflow-hidden rounded-xl border border-[var(--line)] text-sm leading-7 text-[var(--foreground)] transition focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)]">
        <div className="themed-scrollbar h-full overflow-auto">
          <Editor
            value={value}
            onValueChange={onChange}
            highlight={(code) =>
              Prism.highlight(code, Prism.languages.tsx, "tsx")
            }
            padding={16}
            className="min-h-full w-full font-mono"
            textareaClassName="editor-input-textarea"
            preClassName="editor-input-pre"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <span>
          {lineCount} lines | {charCount} chars
        </span>
        <span>Focused editor with behavior-first testing context</span>
      </div>
    </section>
  );
}
