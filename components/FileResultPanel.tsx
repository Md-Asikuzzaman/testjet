"use client";

import { useMemo, useState } from "react";
import {
  FiFileText,
  FiChevronDown,
  FiChevronRight,
  FiDownload,
  FiCheck,
  FiClipboard,
  FiCode,
  FiList,
  FiActivity,
} from "react-icons/fi";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";

import { useFileUploadStore, type UploadedFile } from "@/store/fileUploadStore";
import { formatFileSize } from "@/utils/fileProcessor";

type FileResultPanelProps = {
  files: UploadedFile[];
};

type OutputTab = "tests" | "optimized" | "tips" | "insights";

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

const TEST_PLACEHOLDER = `// Generated Jest + React Testing Library tests will appear here after processing.`;
const OPTIMIZED_PLACEHOLDER = `// Optimized component suggestion will appear here after processing.`;

const scoreMeta = [
  { key: "overall", label: "Overall" },
  { key: "testCoverage", label: "Coverage" },
  { key: "codeQuality", label: "Code Quality" },
  { key: "maintainability", label: "Maintainability" },
  { key: "edgeCaseReadiness", label: "Edge Cases" },
] as const;

function FileResultCard({
  file,
  isExpanded,
  onToggle,
}: {
  file: UploadedFile;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [activeTab, setActiveTab] = useState<OutputTab>("tests");
  const [copiedTab, setCopiedTab] = useState<OutputTab | null>(null);

  const canCopyActiveTab = activeTab === "tests" || activeTab === "optimized";

  const statusColors = {
    idle: "bg-[var(--muted-foreground)]/20",
    loading: "bg-[var(--accent)] animate-pulse",
    success: "bg-green-500",
    error: "bg-red-500",
  };

  const activeContent = useMemo<string>(() => {
    if (!file.result) {
      return activeTab === "tests"
        ? TEST_PLACEHOLDER
        : activeTab === "optimized"
          ? OPTIMIZED_PLACEHOLDER
          : "No data available. Process the file to see results.";
    }

    if (activeTab === "tests") {
      return file.result.testFile || TEST_PLACEHOLDER;
    }

    if (activeTab === "optimized") {
      return file.result.optimizedComponent || OPTIMIZED_PLACEHOLDER;
    }

    if (activeTab === "tips") {
      if (!file.result.tips.length) {
        return "No tips available.";
      }
      return file.result.tips
        .map((tip, index) => `${index + 1}. ${tip}`)
        .join("\n");
    }

    // insights
    const { insights } = file.result;
    return [
      `Summary: ${insights.summary}`,
      "",
      "Strengths:",
      ...insights.strengths.map((item) => `- ${item}`),
      "",
      "Risks:",
      ...insights.risks.map((item) => `- ${item}`),
      "",
      "Recommended Improvements:",
      ...insights.recommendedImprovements.map((item) => `- ${item}`),
      "",
      "Scores (/100):",
      ...scoreMeta.map(
        (item) =>
          `${item.label}: ${insights.qualityScores[item.key as keyof typeof insights.qualityScores]}`,
      ),
    ].join("\n");
  }, [activeTab, file.result]);

  const onCopy = async () => {
    await navigator.clipboard.writeText(activeContent);
    setCopiedTab(activeTab);
    window.setTimeout(() => setCopiedTab(null), 1400);
  };

  const onDownload = () => {
    if (!file.result?.testFile) return;

    const blob = new Blob([file.result.testFile], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.replace(/\.(jsx?|tsx?)$/, "")}.test.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-[var(--panel-muted)]"
      >
        <div className={`h-2.5 w-2.5 rounded-full ${statusColors[file.status]}`} />

        {isExpanded ? (
          <FiChevronDown className="size-4 text-[var(--muted-foreground)]" />
        ) : (
          <FiChevronRight className="size-4 text-[var(--muted-foreground)]" />
        )}

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-[var(--foreground)]">
            {file.name}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {formatFileSize(file.size)}
            {file.status === "success" && file.result && (
              <span className="ml-2 text-green-600 dark:text-green-400">
                ✓ Tests generated
              </span>
            )}
            {file.status === "error" && (
              <span className="ml-2 text-[var(--error)]">
                ✗ {file.error || "Failed"}
              </span>
            )}
          </p>
        </div>

        {file.status === "success" && file.result && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              aria-label="Copy tests"
            >
              {copiedTab === activeTab ? (
                <FiCheck className="size-4" />
              ) : (
                <FiClipboard className="size-4" />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              aria-label="Download tests"
            >
              <FiDownload className="size-4" />
            </button>
          </>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && file.status === "success" && file.result && (
        <div className="border-t border-[var(--line)]">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-[var(--line)] bg-[var(--panel-muted)] px-3 py-2">
            {(Object.keys(tabLabels) as OutputTab[]).map((tab) => {
              const Icon = tabIcons[tab];
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition ${
                    activeTab === tab
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon className="size-3" />
                  {tabLabels[tab]}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="h-[300px] overflow-hidden bg-[var(--editor-bg)]">
            {activeTab === "insights" ? (
              <div className="themed-scrollbar h-full overflow-auto p-4">
                <div className="grid grid-cols-2 gap-2 xl:grid-cols-3 mb-4">
                  {scoreMeta.map((item) => {
                    const value =
                      file.result?.insights.qualityScores[
                        item.key as keyof typeof file.result.insights.qualityScores
                      ] ?? 0;
                    return (
                      <div
                        key={item.key}
                        className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-xl font-bold text-[var(--foreground)]">
                          {value}%
                        </p>
                        <div className="mt-1.5 h-1 rounded-full bg-[var(--panel-muted)]">
                          <div
                            className="h-1 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                      Summary
                    </h4>
                    <p className="text-[var(--foreground)]">
                      {file.result.insights.summary}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                        Strengths
                      </h4>
                      <ul className="space-y-1">
                        {file.result.insights.strengths.map((s, i) => (
                          <li key={i} className="text-[var(--foreground)]">
                            • {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                        Risks
                      </h4>
                      <ul className="space-y-1">
                        {file.result.insights.risks.map((r, i) => (
                          <li key={i} className="text-[var(--foreground)]">
                            • {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                      Recommended Improvements
                    </h4>
                    <ul className="space-y-1">
                      {file.result.insights.recommendedImprovements.map((r, i) => (
                        <li key={i} className="text-[var(--foreground)]">
                          • {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : activeTab === "tips" ? (
              <div className="themed-scrollbar h-full overflow-auto p-4">
                <ul className="space-y-2">
                  {file.result.tips.length > 0 ? (
                    file.result.tips.map((tip, index) => (
                      <li
                        key={index}
                        className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm"
                      >
                        <span className="mr-2 inline-block rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                          Tip {index + 1}
                        </span>
                        {tip}
                      </li>
                    ))
                  ) : (
                    <li className="text-[var(--muted-foreground)]">
                      No tips available.
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <div className="relative h-full overflow-hidden">
                {canCopyActiveTab && (
                  <button
                    type="button"
                    onClick={onCopy}
                    className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--panel)] text-[var(--muted-foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    {copiedTab === activeTab ? (
                      <FiCheck className="size-3.5" />
                    ) : (
                      <FiClipboard className="size-3.5" />
                    )}
                  </button>
                )}
                <div className="themed-scrollbar h-full overflow-auto">
                  <pre className="output-code-pre min-h-full min-w-max p-4 text-sm leading-6">
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {isExpanded && file.status === "error" && (
        <div className="border-t border-[var(--line)] p-4">
          <div className="rounded-lg border border-[var(--error)]/40 bg-[var(--error-soft)] px-4 py-3 text-sm text-[var(--error)]">
            <p className="font-medium">Failed to generate tests</p>
            <p className="mt-1">{file.error || "Unknown error occurred"}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isExpanded && file.status === "loading" && (
        <div className="border-t border-[var(--line)] p-8 text-center">
          <div className="inline-flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accent)]" />
            Generating tests for {file.name}...
          </div>
        </div>
      )}
    </div>
  );
}

export function FileResultPanel({ files }: FileResultPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const processedFiles = files.filter((f) => f.status !== "idle");

  if (processedFiles.length === 0) {
    return (
      <section className="panel-surface flex h-[560px] flex-col items-center justify-center p-4 text-center">
        <FiFileText className="mb-3 size-12 text-[var(--muted-foreground)]/30" />
        <p className="text-sm text-[var(--muted-foreground)]">
          No results yet
        </p>
        <p className="text-xs text-[var(--muted-foreground)]/70">
          Upload and process files to see generated tests
        </p>
      </section>
    );
  }

  return (
    <section className="panel-surface flex h-[560px] flex-col p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Generated Tests
        </h2>
        <span className="text-xs text-[var(--muted-foreground)]">
          {processedFiles.filter((f) => f.status === "success").length} of{" "}
          {processedFiles.length} successful
        </span>
      </div>

      <div className="themed-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
        {processedFiles.map((file) => (
          <FileResultCard
            key={file.id}
            file={file}
            isExpanded={expandedIds.has(file.id)}
            onToggle={() => toggleExpanded(file.id)}
          />
        ))}
      </div>
    </section>
  );
}
