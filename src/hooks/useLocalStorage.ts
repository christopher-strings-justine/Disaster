import { useState, useEffect, useCallback } from 'react';

/**
 * Drop-in replacement for useState that persists to localStorage.
 * On mount, reads the stored value (if any). On every state change, writes back.
 * Falls back to initialValue if the stored JSON is invalid.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setStateRaw] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Quota exceeded or private browsing — fail silently
    }
  }, [key, state]);

  const setState = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (action) => {
      setStateRaw((prev) => {
        const next = typeof action === 'function' ? (action as (prev: T) => T)(prev) : action;
        return next;
      });
    },
    []
  );

  return [state, setState];
}
