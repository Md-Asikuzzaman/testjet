import { buildTestPrompt } from "@/utils/prompt";

export type OpenRouterMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type OpenRouterChoice = {
  message?: {
    content?: string | Array<{ type?: string; text?: string }>;
  };
};

type OpenRouterMessageContent = NonNullable<
  OpenRouterChoice["message"]
>["content"];

type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
  error?: {
    message?: string;
  };
};

export type GeneratedArtifacts = {
  testFile: string;
  optimizedComponent: string;
  tips: string[];
  insights: {
    summary: string;
    strengths: string[];
    risks: string[];
    recommendedImprovements: string[];
    qualityScores: {
      testCoverage: number;
      codeQuality: number;
      maintainability: number;
      edgeCaseReadiness: number;
      overall: number;
    };
  };
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "openrouter/auto",
];

function getModelsFromEnv(): string[] {
  const raw = process.env.NEXT_PUBLIC_OPENROUTER_MODELS;

  if (!raw) {
    return DEFAULT_MODELS;
  }

  const models = raw
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return models.length > 0 ? models : DEFAULT_MODELS;
}

function shouldRetryWithAnotherModel(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("no endpoints found") ||
    normalized.includes("provider returned error") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("model is overloaded") ||
    normalized.includes("rate limit") ||
    normalized.includes("timed out")
  );
}

function normalizeContent(content: OpenRouterMessageContent): string {
  if (!content) {
    return "";
  }

  if (typeof content === "string") {
    return content;
  }

  return content
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
}

function extractJsonPayload(content: string): string {
  const fencedMatch = content.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  return content.trim();
}

function clampScore(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function buildFallbackInsights() {
  return {
    summary:
      "Baseline analysis generated. Re-run generation for richer model-specific insights.",
    strengths: [
      "Component structure is analyzable for behavior-focused tests.",
    ],
    risks: [
      "Detailed architectural risks were not fully returned by the model.",
    ],
    recommendedImprovements: [
      "Add explicit loading/error paths and test them with user-centric assertions.",
      "Prefer role-based queries from React Testing Library for resilient tests.",
    ],
    qualityScores: {
      testCoverage: 72,
      codeQuality: 74,
      maintainability: 73,
      edgeCaseReadiness: 68,
      overall: 72,
    },
  };
}

function parseArtifacts(
  rawContent: string,
  sourceCode: string,
): GeneratedArtifacts {
  const normalized = extractJsonPayload(rawContent);

  try {
    const parsed = JSON.parse(normalized) as Partial<GeneratedArtifacts>;

    const tips = Array.isArray(parsed.tips)
      ? parsed.tips.filter((tip): tip is string => typeof tip === "string")
      : [];

    const fallbackInsights = buildFallbackInsights();
    const parsedInsights =
      parsed.insights && typeof parsed.insights === "object"
        ? parsed.insights
        : null;

    const parsedScores =
      parsedInsights &&
      "qualityScores" in parsedInsights &&
      parsedInsights.qualityScores &&
      typeof parsedInsights.qualityScores === "object"
        ? parsedInsights.qualityScores
        : null;

    return {
      testFile:
        typeof parsed.testFile === "string" && parsed.testFile.trim()
          ? parsed.testFile
          : rawContent,
      optimizedComponent:
        typeof parsed.optimizedComponent === "string" &&
        parsed.optimizedComponent.trim()
          ? parsed.optimizedComponent
          : sourceCode,
      tips:
        tips.length > 0
          ? tips
          : [
              "Validate important user flows using behavior-focused tests.",
              "Keep component props explicit with strict TypeScript types.",
              "Split complex rendering branches into small reusable UI parts.",
            ],
      insights: {
        summary:
          parsedInsights &&
          "summary" in parsedInsights &&
          typeof parsedInsights.summary === "string"
            ? parsedInsights.summary
            : fallbackInsights.summary,
        strengths:
          parsedInsights && "strengths" in parsedInsights
            ? toStringArray(parsedInsights.strengths)
            : fallbackInsights.strengths,
        risks:
          parsedInsights && "risks" in parsedInsights
            ? toStringArray(parsedInsights.risks)
            : fallbackInsights.risks,
        recommendedImprovements:
          parsedInsights && "recommendedImprovements" in parsedInsights
            ? toStringArray(parsedInsights.recommendedImprovements)
            : fallbackInsights.recommendedImprovements,
        qualityScores: {
          testCoverage: clampScore(parsedScores?.testCoverage),
          codeQuality: clampScore(parsedScores?.codeQuality),
          maintainability: clampScore(parsedScores?.maintainability),
          edgeCaseReadiness: clampScore(parsedScores?.edgeCaseReadiness),
          overall: clampScore(parsedScores?.overall),
        },
      },
    };
  } catch {
    const fallbackInsights = buildFallbackInsights();

    return {
      testFile: rawContent,
      optimizedComponent: sourceCode,
      tips: [
        "The model returned non-JSON output; showing fallback values.",
        "Try generating again for a structured optimized component and tips.",
      ],
      insights: fallbackInsights,
    };
  }
}

export async function generateUnitTest(
  userCode: string,
): Promise<GeneratedArtifacts> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  const models = getModelsFromEnv();

  if (!apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_OPENROUTER_API_KEY. Add it to your environment and restart Next.js.",
    );
  }

  const prompt = buildTestPrompt(userCode);
  let lastError = "Failed to generate test. Please try again.";

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    const payload = {
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        } satisfies OpenRouterMessage,
      ],
      temperature: 0.2,
    };

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "TestJet",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as OpenRouterResponse;

      if (!response.ok) {
        lastError = data.error?.message || `Model ${model} failed.`;

        const isLastModel = index === models.length - 1;
        if (!isLastModel && shouldRetryWithAnotherModel(lastError)) {
          continue;
        }

        throw new Error(lastError);
      }

      const generated = normalizeContent(data.choices?.[0]?.message?.content);
      if (!generated) {
        lastError = `Model ${model} returned an empty response.`;
        continue;
      }

      return parseArtifacts(generated, userCode);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected provider error.";
      lastError = message;

      const isLastModel = index === models.length - 1;
      if (!isLastModel && shouldRetryWithAnotherModel(message)) {
        continue;
      }

      throw new Error(lastError);
    }
  }

  throw new Error(
    `${lastError}\n\nTip: Set NEXT_PUBLIC_OPENROUTER_MODELS in .env.local to available model IDs (comma-separated), for example: meta-llama/llama-3.3-70b-instruct:free,mistralai/mistral-7b-instruct:free`,
  );
}
