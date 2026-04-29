import type { UploadedFile } from "@/store/fileUploadStore";

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ALLOWED_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];

export type FileValidationError =
  | "FILE_TOO_LARGE"
  | "INVALID_EXTENSION"
  | "READ_ERROR";

export type FileValidationResult =
  | { valid: true; file: File }
  | { valid: false; file: File; error: FileValidationError; message: string };

export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      file,
      error: "FILE_TOO_LARGE",
      message: `File "${file.name}" exceeds 1MB limit (${(file.size / 1024).toFixed(1)}KB)`,
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      file,
      error: "INVALID_EXTENSION",
      message: `File "${file.name}" has unsupported extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  return { valid: true, file };
}

export function validateFiles(files: File[]): {
  valid: File[];
  invalid: { file: File; message: string }[];
} {
  const valid: File[] = [];
  const invalid: { file: File; message: string }[] = [];

  for (const file of files) {
    const result = validateFile(file);
    if (result.valid) {
      valid.push(file);
    } else {
      invalid.push({ file, message: result.message });
    }
  }

  return { valid, invalid };
}

export function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        resolve(content);
      } else {
        reject(new Error("Failed to read file content"));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsText(file);
  });
}

export async function processFiles(files: File[]): Promise<{
  uploadedFiles: UploadedFile[];
  errors: string[];
}> {
  const uploadedFiles: UploadedFile[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const content = await readFileContent(file);
      uploadedFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        content,
        status: "idle",
      });
    } catch (error) {
      errors.push(
        error instanceof Error
          ? error.message
          : `Failed to process file: ${file.name}`,
      );
    }
  }

  return { uploadedFiles, errors };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
