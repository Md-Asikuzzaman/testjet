import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GeneratedArtifacts } from "@/utils/openrouter";

export type UploadedFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  content: string;
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  result?: GeneratedArtifacts;
};

export type InputMode = "paste" | "upload";

type FileUploadState = {
  // Mode selection
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;

  // Uploaded files
  files: UploadedFile[];
  addFiles: (files: UploadedFile[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  updateFileStatus: (
    id: string,
    status: UploadedFile["status"],
    updates?: Partial<UploadedFile>,
  ) => void;

  // Batch processing
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  overallProgress: number;
  setOverallProgress: (value: number) => void;

  // Errors
  globalError: string | null;
  setGlobalError: (error: string | null) => void;
};

export const useFileUploadStore = create<FileUploadState>()(
  devtools(
    (set) => ({
      // Mode
      inputMode: "paste",
      setInputMode: (mode) => set({ inputMode: mode }),

      // Files
      files: [],
      addFiles: (newFiles) =>
        set((state) => ({
          files: [...state.files, ...newFiles],
        })),
      removeFile: (id) =>
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
        })),
      clearFiles: () =>
        set({
          files: [],
          globalError: null,
          overallProgress: 0,
        }),
      updateFileStatus: (id, status, updates) =>
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, status, ...updates } : f,
          ),
        })),

      // Processing
      isProcessing: false,
      setIsProcessing: (value) => set({ isProcessing: value }),
      overallProgress: 0,
      setOverallProgress: (value) => set({ overallProgress: value }),

      // Errors
      globalError: null,
      setGlobalError: (error) => set({ globalError: error }),
    }),
    { name: "FileUploadStore" },
  ),
);
