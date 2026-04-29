"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import {
  useFileUploadStore,
  type UploadedFile,
} from "@/store/fileUploadStore";
import {
  validateFiles,
  processFiles,
  formatFileSize,
} from "@/utils/fileProcessor";

export type UseFileUploadReturn = {
  // Dropzone props
  getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
  isDragActive: boolean;

  // File management
  files: UploadedFile[];
  addFiles: (newFiles: File[]) => Promise<void>;
  removeFile: (id: string) => void;
  clearFiles: () => void;

  // Utilities
  formatFileSize: (bytes: number) => string;

  // Validation errors from last add
  lastValidationErrors: string[];
};

export function useFileUpload(): UseFileUploadReturn {
  const files = useFileUploadStore((state) => state.files);
  const addFilesToStore = useFileUploadStore((state) => state.addFiles);
  const removeFileFromStore = useFileUploadStore((state) => state.removeFile);
  const clearFilesInStore = useFileUploadStore((state) => state.clearFiles);
  const setGlobalError = useFileUploadStore((state) => state.setGlobalError);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setGlobalError(null);

      if (acceptedFiles.length === 0) {
        return;
      }

      // Validate files
      const { valid, invalid } = validateFiles(acceptedFiles);

      // Show validation errors
      if (invalid.length > 0) {
        const errorMessages = invalid.map((i) => i.message);
        setGlobalError(errorMessages.join("; "));
      }

      if (valid.length === 0) {
        return;
      }

      // Process valid files
      const { uploadedFiles, errors } = await processFiles(valid);

      if (errors.length > 0) {
        setGlobalError(errors.join("; "));
      }

      if (uploadedFiles.length > 0) {
        addFilesToStore(uploadedFiles);
      }
    },
    [addFilesToStore, setGlobalError],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        "text/javascript": [".js"],
        "text/jsx": [".jsx"],
        "text/typescript": [".ts"],
        "text/tsx": [".tsx"],
      },
      multiple: true,
    });

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      await onDrop(newFiles);
    },
    [onDrop],
  );

  const removeFile = useCallback(
    (id: string) => {
      removeFileFromStore(id);
    },
    [removeFileFromStore],
  );

  const clearFiles = useCallback(() => {
    clearFilesInStore();
  }, [clearFilesInStore]);

  // Get validation errors from file rejections
  const lastValidationErrors = fileRejections.map(
    (rejection) =>
      `${rejection.file.name}: ${rejection.errors.map((e) => e.message).join(", ")}`,
  );

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    files,
    addFiles,
    removeFile,
    clearFiles,
    formatFileSize,
    lastValidationErrors,
  };
}
