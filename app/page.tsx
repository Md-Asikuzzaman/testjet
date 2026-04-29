"use client";

import { useEffect } from "react";
import { FiType, FiUpload, FiCpu, FiZap, FiRefreshCw } from "react-icons/fi";

import { ActionBar } from "@/components/ActionBar";
import { EditorPanel } from "@/components/EditorPanel";
import { OutputPanel } from "@/components/OutputPanel";
import { FileUploadPanel } from "@/components/FileUploadPanel";
import { FileResultPanel } from "@/components/FileResultPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Spinner } from "@/components/Spinner";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useTestGenerator } from "@/hooks/useTestGenerator";
import { useBatchTestGenerator } from "@/hooks/useBatchTestGenerator";
import { useTheme } from "@/hooks/useTheme";
import { useFileUploadStore, type InputMode } from "@/store/fileUploadStore";

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

function InputModeTabs({
  mode,
  onChange,
}: {
  mode: InputMode;
  onChange: (mode: InputMode) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-[var(--line)] bg-[var(--panel-muted)] p-1">
      <button
        type="button"
        onClick={() => onChange("paste")}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
          mode === "paste"
            ? "bg-[var(--accent)] text-white"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`}
      >
        <FiType className="size-3.5" />
        Paste Code
      </button>
      <button
        type="button"
        onClick={() => onChange("upload")}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
          mode === "upload"
            ? "bg-[var(--accent)] text-white"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`}
      >
        <FiUpload className="size-3.5" />
        Upload Files
      </button>
    </div>
  );
}

function FileActionBar({
  onGenerate,
  onRetry,
  isProcessing,
  hasFiles,
  hasPending,
  hasFailed,
}: {
  onGenerate: () => void;
  onRetry: () => void;
  isProcessing: boolean;
  hasFiles: boolean;
  hasPending: boolean;
  hasFailed: boolean;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {hasPending && (
          <button
            type="button"
            onClick={onGenerate}
            disabled={isProcessing || !hasFiles}
            className="ai-cta-button group inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 text-black"
          >
            {isProcessing ? (
              <>
                <FiCpu className="size-4 animate-pulse" />
                Processing Files...
              </>
            ) : (
              <>
                <FiZap className="size-4 transition group-hover:rotate-12" />
                Generate Tests for Files
              </>
            )}
          </button>
        )}

        {hasFailed && !isProcessing && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <FiRefreshCw className="size-4" />
            Retry Failed
          </button>
        )}
      </div>

      {isProcessing ? <Spinner label="Processing..." /> : null}
    </div>
  );
}

export default function Home() {
  // Paste mode state
  const [sourceCode, setSourceCode] = usePersistentState<string>(
    "test-generator-source-code",
    starterComponent,
  );
  const {
    generated,
    isLoading: isGeneratingSingle,
    error: singleError,
    generate,
  } = useTestGenerator();

  // Upload mode state
  const inputMode = useFileUploadStore((state) => state.inputMode);
  const setInputMode = useFileUploadStore((state) => state.setInputMode);
  const files = useFileUploadStore((state) => state.files);
  const globalError = useFileUploadStore((state) => state.globalError);

  const {
    isProcessing: isProcessingBatch,
    generateForFiles,
    retryFailed,
  } = useBatchTestGenerator();

  const { theme, toggleTheme } = useTheme();

  // Keyboard shortcut for paste mode
  useEffect(() => {
    if (inputMode !== "paste") return;

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
  }, [generate, sourceCode, inputMode]);

  const handleGeneratePaste = () => {
    generate(sourceCode);
  };

  const handleGenerateFiles = () => {
    generateForFiles();
  };

  const hasFiles = files.length > 0;
  const hasPendingFiles = files.some(
    (f) => f.status === "idle" || f.status === "error",
  );
  const hasFailedFiles = files.some((f) => f.status === "error");

  const displayError = inputMode === "paste" ? singleError : globalError;

  return (
    <main className="relative flex-1 overflow-hidden px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full flex-col px-2 md:px-3 lg:px-5">
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

        {/* Input Mode Tabs */}
        <div className="mb-4">
          <InputModeTabs mode={inputMode} onChange={setInputMode} />
        </div>

        {/* Action Bar - Paste Mode */}
        {inputMode === "paste" && (
          <>
            <ActionBar
              onGenerate={handleGeneratePaste}
              isLoading={isGeneratingSingle}
            />
            <div className="mb-4 flex items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
              <span>Shortcut: Ctrl/Cmd + Enter to generate</span>
            </div>
          </>
        )}

        {/* Action Bar - Upload Mode */}
        {inputMode === "upload" && (
          <FileActionBar
            onGenerate={handleGenerateFiles}
            onRetry={retryFailed}
            isProcessing={isProcessingBatch}
            hasFiles={hasFiles}
            hasPending={hasPendingFiles}
            hasFailed={hasFailedFiles}
          />
        )}

        {/* Error Display */}
        {displayError ? (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-[var(--error)]/40 bg-[var(--error-soft)] px-4 py-3 text-sm text-[var(--error)]"
          >
            {displayError}
          </div>
        ) : null}

        {/* Content Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {inputMode === "paste" ? (
            <>
              <EditorPanel
                value={sourceCode}
                onChange={setSourceCode}
                isLoading={isGeneratingSingle}
              />
              <OutputPanel generated={generated} />
            </>
          ) : (
            <>
              <FileUploadPanel
                onGenerate={handleGenerateFiles}
                isProcessing={isProcessingBatch}
              />
              <FileResultPanel files={files} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
