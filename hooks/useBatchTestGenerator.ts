"use client";

import { useCallback, useState } from "react";

import {
  useFileUploadStore,
  type UploadedFile,
} from "@/store/fileUploadStore";
import { generateUnitTest, type GeneratedArtifacts } from "@/utils/openrouter";

const CONCURRENCY_LIMIT = 3;

export type BatchProgress = {
  completed: number;
  total: number;
  percentage: number;
};

export type UseBatchTestGeneratorReturn = {
  isProcessing: boolean;
  progress: BatchProgress;
  globalError: string | null;
  generateForFiles: (fileIds?: string[]) => Promise<void>;
  generateForSingleFile: (fileId: string) => Promise<void>;
  retryFailed: () => Promise<void>;
};

async function processWithConcurrencyLimit<T, R>(
  items: T[],
  limit: number,
  processor: (item: T) => Promise<R>,
): Promise<{ item: T; result?: R; error?: Error }[]> {
  const results: { item: T; result?: R; error?: Error }[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = processor(item)
      .then((result) => {
        results.push({ item, result });
      })
      .catch((error) => {
        results.push({ item, error: error instanceof Error ? error : new Error(String(error)) });
      });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1,
      );
    }
  }

  await Promise.all(executing);
  return results;
}

export function useBatchTestGenerator(): UseBatchTestGeneratorReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress>({
    completed: 0,
    total: 0,
    percentage: 0,
  });
  const [globalError, setGlobalError] = useState<string | null>(null);

  const files = useFileUploadStore((state) => state.files);
  const updateFileStatus = useFileUploadStore((state) => state.updateFileStatus);
  const setStoreIsProcessing = useFileUploadStore((state) => state.setIsProcessing);
  const setOverallProgress = useFileUploadStore((state) => state.setOverallProgress);

  const updateProgress = useCallback(
    (completed: number, total: number) => {
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      setProgress({ completed, total, percentage });
      setOverallProgress(percentage);
    },
    [setOverallProgress],
  );

  const generateForSingleFile = useCallback(
    async (fileId: string) => {
      const file = files.find((f) => f.id === fileId);
      if (!file) return;

      updateFileStatus(fileId, "loading");

      try {
        const result = await generateUnitTest(file.content);
        updateFileStatus(fileId, "success", { result });
      } catch (error) {
        updateFileStatus(fileId, "error", {
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate tests",
        });
      }
    },
    [files, updateFileStatus],
  );

  const generateForFiles = useCallback(
    async (fileIds?: string[]) => {
      const targetFiles = fileIds
        ? files.filter((f) => fileIds.includes(f.id) && f.status !== "loading")
        : files.filter((f) => f.status !== "loading" && f.status !== "success");

      if (targetFiles.length === 0) {
        setGlobalError("No files to process");
        return;
      }

      setGlobalError(null);
      setIsProcessing(true);
      setStoreIsProcessing(true);
      updateProgress(0, targetFiles.length);

      // Mark all target files as loading
      for (const file of targetFiles) {
        updateFileStatus(file.id, "loading");
      }

      let completed = 0;

      const processFile = async (file: UploadedFile) => {
        try {
          const result = await generateUnitTest(file.content);
          updateFileStatus(file.id, "success", { result });
        } catch (error) {
          updateFileStatus(file.id, "error", {
            error:
              error instanceof Error
                ? error.message
                : "Failed to generate tests",
          });
        } finally {
          completed += 1;
          updateProgress(completed, targetFiles.length);
        }
      };

      await processWithConcurrencyLimit(
        targetFiles,
        CONCURRENCY_LIMIT,
        processFile,
      );

      setIsProcessing(false);
      setStoreIsProcessing(false);
    },
    [files, updateFileStatus, updateProgress, setStoreIsProcessing],
  );

  const retryFailed = useCallback(async () => {
    const failedFiles = files.filter((f) => f.status === "error");
    const failedIds = failedFiles.map((f) => f.id);

    if (failedIds.length === 0) {
      setGlobalError("No failed files to retry");
      return;
    }

    await generateForFiles(failedIds);
  }, [files, generateForFiles]);

  return {
    isProcessing,
    progress,
    globalError,
    generateForFiles,
    generateForSingleFile,
    retryFailed,
  };
}
