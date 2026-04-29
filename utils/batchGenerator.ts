import { generateUnitTest, type GeneratedArtifacts } from "./openrouter";

export type BatchFileResult = {
  fileName: string;
  success: boolean;
  result?: GeneratedArtifacts;
  error?: string;
};

const CONCURRENCY_LIMIT = 3;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(
  code: string,
  fileName: string,
  attempt = 1,
): Promise<BatchFileResult> {
  try {
    const result = await generateUnitTest(code);
    return {
      fileName,
      success: true,
      result,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Check if we should retry
    const shouldRetry =
      attempt < RETRY_ATTEMPTS &&
      (errorMessage.toLowerCase().includes("rate limit") ||
        errorMessage.toLowerCase().includes("timeout") ||
        errorMessage.toLowerCase().includes("temporarily unavailable"));

    if (shouldRetry) {
      await delay(RETRY_DELAY_MS * attempt);
      return generateWithRetry(code, fileName, attempt + 1);
    }

    return {
      fileName,
      success: false,
      error: errorMessage,
    };
  }
}

async function processWithConcurrencyLimit<T, R>(
  items: T[],
  limit: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = processor(item).then((result) => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      const index = executing.findIndex((p) => p === promise);
      if (index !== -1) {
        executing.splice(index, 1);
      }
    }
  }

  await Promise.all(executing);
  return results;
}

export async function generateTestsFromFiles(
  files: { name: string; content: string }[],
  onProgress?: (completed: number, total: number) => void,
): Promise<BatchFileResult[]> {
  const total = files.length;
  let completed = 0;

  const processFile = async (file: { name: string; content: string }) => {
    const result = await generateWithRetry(file.content, file.name);
    completed += 1;
    onProgress?.(completed, total);
    return result;
  };

  return processWithConcurrencyLimit(files, CONCURRENCY_LIMIT, processFile);
}

export function downloadTestFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAllTests(
  results: { fileName: string; testContent: string }[],
): void {
  // Create a zip-like experience by downloading each file
  results.forEach(({ fileName, testContent }) => {
    downloadTestFile(fileName, testContent);
  });
}
