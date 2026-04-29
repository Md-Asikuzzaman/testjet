"use client";

import { FiCpu, FiZap } from "react-icons/fi";

import { Spinner } from "@/components/Spinner";

type ActionBarProps = {
  onGenerate: () => void;
  isLoading: boolean;
};

export function ActionBar({ onGenerate, isLoading }: ActionBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isLoading}
          className="ai-cta-button group inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 text-black"
        >
          {isLoading ? (
            <>
              <FiCpu className="size-4 animate-pulse" />
              Generating Senior Tests...
            </>
          ) : (
            <>
              <FiZap className="size-4 transition group-hover:rotate-12" />
              Generate Test Suite
            </>
          )}
        </button>
      </div>

      {isLoading ? <Spinner /> : null}
    </div>
  );
}
