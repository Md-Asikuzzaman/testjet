"use client";

import { useMemo } from "react";

type EditorPanelProps = {
  value: string;
  onChange: (value: string) => void;
};

export function EditorPanel({ value, onChange }: EditorPanelProps) {
  const lineCount = useMemo(() => value.split("\n").length, [value]);
  const charCount = useMemo(() => value.length, [value]);

  return (
    <section className="panel-surface relative flex h-[560px] flex-col overflow-hidden p-4 md:p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--accent-2)] to-[var(--accent-3)]" />

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Component Input
        </h2>
        <div className="inline-flex items-center gap-2">
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
            React / Next.js
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            Paste component
          </span>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste your component code here..."
        className="code-editor-surface themed-scrollbar h-full min-h-0 w-full resize-none rounded-xl border border-[var(--line)] p-4 font-mono text-sm leading-7 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        spellCheck={false}
      />

      <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <span>
          {lineCount} lines | {charCount} chars
        </span>
        <span>Focused editor with behavior-first testing context</span>
      </div>
    </section>
  );
}
