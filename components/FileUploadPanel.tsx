"use client";

import { useCallback, useRef } from "react";
import {
  FiUploadCloud,
  FiFile,
  FiX,
  FiTrash2,
  FiAlertCircle,
} from "react-icons/fi";

import { useFileUpload } from "@/hooks/useFileUpload";
import { useFileUploadStore } from "@/store/fileUploadStore";
import { Spinner } from "./Spinner";

type FileUploadPanelProps = {
  onGenerate: () => void;
  isProcessing: boolean;
};

function FileItem({
  file,
  onRemove,
}: {
  file: ReturnType<typeof useFileUpload>["files"][0];
  onRemove: () => void;
}) {
  const formatFileSize = useFileUpload().formatFileSize;

  const statusIcon = {
    idle: null,
    loading: <Spinner label="" />,
    success: (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        Done
      </span>
    ),
    error: (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Error
      </span>
    ),
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 transition hover:border-[var(--accent)]/50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
        <FiFile className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--foreground)]">
          {file.name}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {formatFileSize(file.size)}
        </p>
        {file.error && (
          <p className="mt-1 text-xs text-[var(--error)]">{file.error}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {statusIcon[file.status]}
        <button
          type="button"
          onClick={onRemove}
          disabled={file.status === "loading"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition hover:bg-[var(--error-soft)] hover:text-[var(--error)] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Remove ${file.name}`}
        >
          <FiX className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function FileUploadPanel({
  onGenerate,
  isProcessing,
}: FileUploadPanelProps) {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    files,
    removeFile,
    clearFiles,
    lastValidationErrors,
  } = useFileUpload();

  const globalError = useFileUploadStore((state) => state.globalError);
  const overallProgress = useFileUploadStore((state) => state.overallProgress);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const hasFiles = files.length > 0;
  const allSuccess = files.length > 0 && files.every((f) => f.status === "success");
  const hasPending = files.some((f) => f.status === "idle" || f.status === "error");

  return (
    <section className="panel-surface relative flex h-[560px] flex-col overflow-hidden p-4 md:p-5">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Upload Files for Test Generation
        </h2>
        <div className="inline-flex items-center gap-2">
          {hasFiles && (
            <button
              type="button"
              onClick={clearFiles}
              disabled={isProcessing}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)] transition hover:border-[var(--error)] hover:text-[var(--error)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiTrash2 className="size-3" />
              Clear All
            </button>
          )}
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
            React / Next.js
          </span>
        </div>
      </div>

      {/* Error display */}
      {(globalError || lastValidationErrors.length > 0) && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-[var(--error)]/40 bg-[var(--error-soft)] px-3 py-2 text-sm text-[var(--error)]"
        >
          <div className="flex items-start gap-2">
            <FiAlertCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              {globalError && <p>{globalError}</p>}
              {lastValidationErrors.length > 0 && (
                <ul className="mt-1 list-disc pl-4">
                  {lastValidationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`relative mb-3 cursor-pointer rounded-xl border-2 border-dashed p-6 transition ${
          isDragActive
            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
            : "border-[var(--line)] bg-[var(--panel-muted)] hover:border-[var(--accent)]/50"
        }`}
      >
        <input {...getInputProps()} ref={fileInputRef} />

        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
              isDragActive
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--panel)] text-[var(--accent)]"
            }`}
          >
            <FiUploadCloud className="size-6" />
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {isDragActive
                ? "Drop files here..."
                : "Drag & drop files here, or click to browse"}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Supported: .js, .jsx, .ts, .tsx (max 1MB per file)
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            className="mt-1 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent)]/90"
          >
            Browse Files
          </button>
        </div>
      </div>

      {/* File list */}
      {hasFiles && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
              Uploaded Files ({files.length})
            </h3>
            {isProcessing && (
              <span className="text-xs text-[var(--accent)]">
                {overallProgress}%
              </span>
            )}
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <div className="mb-3 h-1.5 shrink-0 rounded-full bg-[var(--panel-muted)]">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          )}

          <div className="themed-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasFiles && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No files uploaded yet
          </p>
          <p className="text-xs text-[var(--muted-foreground)]/70">
            Upload component files to generate tests
          </p>
        </div>
      )}

      {/* Footer stats */}
      {hasFiles && (
        <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3 text-xs text-[var(--muted-foreground)]">
          <span>
            {files.filter((f) => f.status === "success").length} of{" "}
            {files.length} files processed
          </span>
          <span>
            {files.filter((f) => f.status === "loading").length} in progress
          </span>
        </div>
      )}
    </section>
  );
}
