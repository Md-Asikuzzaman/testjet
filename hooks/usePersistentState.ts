"use client";

import { useEffect, useState } from "react";

export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const rawValue = window.localStorage.getItem(key);
      return rawValue !== null ? (JSON.parse(rawValue) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore write failures in restricted environments.
    }
  }, [key, state]);

  return [state, setState];
}
