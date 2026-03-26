# TestJet

TestJet is an AI-powered web app that generates Jest + React Testing Library unit tests, optimized component code, and senior-level insights from React or Next.js component input.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- Frontend-only API calls to OpenRouter

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env.local` in project root:

```bash
NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
```

3. Run the app:

```bash
pnpm dev
```

4. Open `http://localhost:3000`.

## Features

- Two-panel layout: component input and generated test output
- Syntax-highlighted output with line numbers
- One-click generation using OpenRouter Llama model
- Copy-to-clipboard action
- Loading spinner and error state UI
- Debounced API call execution
- Persistent user input (localStorage)
- Dark/light mode toggle with persistence

## Project Structure

- `app/` App Router pages and global styles
- `components/` Reusable UI components
- `hooks/` Debounce, persistence, theme, and generation hooks
- `utils/` Prompt template and OpenRouter integration
