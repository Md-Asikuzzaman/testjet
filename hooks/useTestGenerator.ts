"use client";

import { useCallback, useState } from "react";

import type { GeneratedArtifacts } from "@/utils/openrouter";
import { generateUnitTest } from "@/utils/openrouter";

type UseTestGeneratorResult = {
  generated: GeneratedArtifacts;
  isLoading: boolean;
  error: string | null;
  generate: (sourceCode: string) => void;
};

function hasBasicComponentStructure(code: string): boolean {
  const hasComponentDeclaration =
    /(export\s+default\s+function|export\s+function|function\s+[A-Z]\w*|const\s+[A-Z]\w*\s*=\s*\(?[^=]*=>|class\s+[A-Z]\w*\s+extends\s+React\.Component)/m.test(
      code,
    );
  const hasJsxLikeMarkup = /<\/?[A-Za-z][\w:-]*(\s[^>]*)?>/m.test(code);
  const hasFragmentMarkup = /<>|<\/>/.test(code);
  const hasReturnKeyword = /\breturn\b/m.test(code);

  return (
    hasComponentDeclaration &&
    (hasJsxLikeMarkup || hasFragmentMarkup) &&
    hasReturnKeyword
  );
}

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

  const generate = useCallback((sourceCode: string) => {
    const code = sourceCode.trim();

    if (!code) {
      setError("Paste a React or Next.js component before generating tests.");
      return;
    }

    if (!hasBasicComponentStructure(code)) {
      setError(
        "Input does not look like a valid React/Next.js component. Add a component declaration and returned JSX before generating.",
      );
      return;
    }

    setError(null);
    setIsLoading(true);
    generateUnitTest(code)
      .then((output) => {
        setGenerated(output);
      })
      .catch((generationError: unknown) => {
        setError(
          generationError instanceof Error
            ? generationError.message
            : "Unexpected error while generating tests.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return {
    generated,
    isLoading,
    error,
    generate,
  };
}
