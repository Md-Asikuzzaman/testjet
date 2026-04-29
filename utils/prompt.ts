export const TEST_GENERATION_PROMPT = `You are a senior React developer and testing expert.

Analyze the following React/Next.js component and produce senior-level test and quality outputs.

Requirements:
- Use Jest and React Testing Library
- Cover:
  - Rendering
  - Props
  - User interactions
  - Conditional rendering
  - Edge cases
  - Loading and error states
- Mock API calls and external dependencies
- Follow best practices:
  - Test behavior, not implementation
  - Clean and maintainable code
  - Prefer accessible queries and user-centric assertions
  - Include realistic mock/stub strategy

Optimization requirements:
- Provide an optimized component refactor emphasizing readability, composability, and explicit typing
- Include concrete performance and maintainability improvements

Scoring requirements:
- Provide quality scores from 0 to 100 for:
  - testCoverage
  - codeQuality
  - maintainability
  - edgeCaseReadiness
- overall should be a weighted final score out of 100

Output:
- Return ONLY valid JSON (no markdown) with this exact shape:
  {
    "testFile": "<full Jest + RTL test file>",
    "optimizedComponent": "<refactored/improved component code>",
    "tips": ["<tip 1>", "<tip 2>", "<tip 3>"],
    "insights": {
      "summary": "<concise technical summary>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "risks": ["<risk 1>", "<risk 2>"],
      "recommendedImprovements": ["<improvement 1>", "<improvement 2>"],
      "qualityScores": {
        "testCoverage": 0,
        "codeQuality": 0,
        "maintainability": 0,
        "edgeCaseReadiness": 0,
        "overall": 0
      }
    }
  }

Rules:
- Keep code blocks as plain strings in JSON
- tips must be concise and practical
- Do not include explanation text outside the JSON object

Component:
{{USER_CODE}}`;

export function buildTestPrompt(userCode: string): string {
  return TEST_GENERATION_PROMPT.replace("{{USER_CODE}}", userCode.trim());
}
