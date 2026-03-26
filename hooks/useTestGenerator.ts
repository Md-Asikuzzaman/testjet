"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { GeneratedArtifacts } from "@/utils/openrouter";
import { generateUnitTest } from "@/utils/openrouter";

type UseTestGeneratorResult = {
  generated: GeneratedArtifacts;
  isLoading: boolean;
  error: string | null;
  generate: (sourceCode: string) => void;
  debounceMs: number;
};

const DEBOUNCE_MS = 250;

export function useTestGenerator(): UseTestGeneratorResult {
  const [generated, setGenerated] = useState<GeneratedArtifacts>({
    testFile: "",
    optimizedComponent: "",
    tips: [],
    insights: {
      summary: "Run generation to receive component quality analysis.",
      strengths: [],
      risks: [],
      recommendedImprovements: [],
      qualityScores: {
        testCoverage: 0,
        codeQuality: 0,
        maintainability: 0,
        edgeCaseReadiness: 0,
        overall: 0,
      },
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const generate = useCallback((sourceCode: string) => {
    const code = sourceCode.trim();

    if (!code) {
      setError("Paste a React or Next.js component before generating tests.");
      return;
    }

    setError(null);
    setIsLoading(true);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        const output = await generateUnitTest(code);
        setGenerated(output);
      } catch (generationError) {
        setError(
          generationError instanceof Error
            ? generationError.message
            : "Unexpected error while generating tests.",
        );
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    generated,
    isLoading,
    error,
    generate,
    debounceMs: DEBOUNCE_MS,
  };
}
