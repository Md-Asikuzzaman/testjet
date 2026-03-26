"use client";

import { useMemo, useState } from "react";
import {
  FiActivity,
  FiCheck,
  FiClipboard,
  FiCode,
  FiFileText,
  FiList,
} from "react-icons/fi";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";
import type { GeneratedArtifacts } from "@/utils/openrouter";

type OutputPanelProps = {
  generated: GeneratedArtifacts;
};

type OutputTab = "tests" | "optimized" | "tips" | "insights";

const TEST_PLACEHOLDER = `// Generated Jest + React Testing Library tests will appear here\n// Click "Generate Test" to run AI analysis.`;
const OPTIMIZED_PLACEHOLDER = `// Optimized component suggestion will appear here\n// Generate once to receive a cleaner component version.`;

const tabLabels: Record<OutputTab, string> = {
  tests: "Generated Test",
  optimized: "Optimized Component",
  tips: "Tips",
  insights: "Insights",
};

const tabIcons: Record<OutputTab, typeof FiFileText> = {
  tests: FiFileText,
  optimized: FiCode,
  tips: FiList,
  insights: FiActivity,
};

const scoreMeta = [
  { key: "overall", label: "Overall" },
  { key: "testCoverage", label: "Coverage" },
  { key: "codeQuality", label: "Code Quality" },
  { key: "maintainability", label: "Maintainability" },
  { key: "edgeCaseReadiness", label: "Edge Cases" },
] as const;

export function OutputPanel({ generated }: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<OutputTab>("tests");
  const [copiedTab, setCopiedTab] = useState<OutputTab | null>(null);

  const activeContent = useMemo<string>(() => {
    if (activeTab === "tests") {
      return generated.testFile || TEST_PLACEHOLDER;
    }

    if (activeTab === "optimized") {
      return generated.optimizedComponent || OPTIMIZED_PLACEHOLDER;
    }

    if (!generated.tips.length) {
      return "No tips yet. Generate to receive actionable guidance.";
    }

    if (activeTab === "tips") {
      return generated.tips
        .map((tip, index) => `${index + 1}. ${tip}`)
        .join("\n");
    }

    return [
      `Summary: ${generated.insights.summary}`,
      "",
      "Strengths:",
      ...generated.insights.strengths.map((item) => `- ${item}`),
      "",
      "Risks:",
      ...generated.insights.risks.map((item) => `- ${item}`),
      "",
      "Recommended Improvements:",
      ...generated.insights.recommendedImprovements.map((item) => `- ${item}`),
      "",
      "Scores (/100):",
      ...scoreMeta.map(
        (item) =>
          `${item.label}: ${generated.insights.qualityScores[item.key]}`,
      ),
    ].join("\n");
  }, [activeTab, generated]);

  const onCopy = async () => {
    await navigator.clipboard.writeText(activeContent);
    setCopiedTab(activeTab);
    window.setTimeout(() => {
      setCopiedTab(null);
    }, 1400);
  };

  return (
    <section className="panel-surface flex h-[560px] flex-col p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(tabLabels) as OutputTab[]).map((tab) => {
            const Icon = tabIcons[tab];

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] text-[var(--accent-contrast)] shadow-[0_10px_28px_-14px_var(--accent)]"
                    : "border border-[var(--line)] bg-[var(--panel-muted)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
                }`}
              >
                <Icon className="size-4" />
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          {copiedTab === activeTab ? (
            <FiCheck className="size-4" />
          ) : (
            <FiClipboard className="size-4" />
          )}
          {copiedTab === activeTab ? "Copied" : `Copy ${tabLabels[activeTab]}`}
        </button>
      </div>

      <div className="h-full overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel-muted)]">
        {activeTab === "insights" ? (
          <div className="themed-scrollbar h-full overflow-auto p-4 md:p-5">
            <p className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm leading-6 text-[var(--foreground)]">
              {generated.insights.summary ||
                "Generate to view senior-quality insights."}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
              {scoreMeta.map((item) => {
                const value = generated.insights.qualityScores[item.key];

                return (
                  <div
                    key={item.key}
                    className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">
                      {value}%
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-[var(--panel-muted)]">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                  Strengths
                </h3>
                <ul className="space-y-2 text-sm leading-6">
                  {(generated.insights.strengths.length
                    ? generated.insights.strengths
                    : ["Generate to see strengths."]
                  ).map((item, idx) => (
                    <li key={`${item}-${idx}`}>- {item}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                  Risks
                </h3>
                <ul className="space-y-2 text-sm leading-6">
                  {(generated.insights.risks.length
                    ? generated.insights.risks
                    : ["Generate to see risks."]
                  ).map((item, idx) => (
                    <li key={`${item}-${idx}`}>- {item}</li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                Recommended Improvements
              </h3>
              <ul className="space-y-2 text-sm leading-6">
                {(generated.insights.recommendedImprovements.length
                  ? generated.insights.recommendedImprovements
                  : ["Generate to see improvement recommendations."]
                ).map((item, idx) => (
                  <li key={`${item}-${idx}`}>- {item}</li>
                ))}
              </ul>
            </section>
          </div>
        ) : activeTab === "tips" ? (
          <div className="themed-scrollbar h-full overflow-auto p-4 md:p-5">
            <ul className="space-y-3">
              {(generated.tips.length
                ? generated.tips
                : ["Generate to receive actionable tips."]
              ).map((tip, index) => (
                <li
                  key={`${tip}-${index}`}
                  className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm leading-6"
                >
                  <span className="mr-2 inline-block rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                    Tip {index + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="themed-scrollbar h-full overflow-auto">
            <pre className="output-code-pre min-h-full min-w-max p-4 text-sm leading-7">
              <code
                dangerouslySetInnerHTML={{
                  __html: Prism.highlight(
                    activeContent,
                    Prism.languages.tsx,
                    "tsx",
                  ),
                }}
              />
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
