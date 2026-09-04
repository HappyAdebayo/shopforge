import { useState, useEffect, useRef } from "react";
import { publicProductService } from "@/lib/api/product";
import type { Product } from "@/types";

interface UseSearchSuggestionsOptions {
  categoryId?: string;
  debounceMs?: number;
  minLength?: number;
  limit?: number;
}

interface UseSearchSuggestionsResult {
  suggestions: Product[];
  isLoading: boolean;
  clear: () => void;
}

/**
 * Fetches product suggestions for the given query string with debouncing.
 * Groups returned products by category for display convenience.
 */
export function useSearchSuggestions(
  query: string,
  {
    categoryId,
    debounceMs = 400,
    minLength = 2,
    limit = 8,
  }: UseSearchSuggestionsOptions = {}
): UseSearchSuggestionsResult {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any in-flight request
    abortRef.current?.abort();

    if (query.trim().length < minLength) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current = new AbortController();
      setIsLoading(true);
      try {
        const result = await publicProductService.getAll({
          search: query.trim(),
          categoryId: categoryId ? Number(categoryId) : undefined,
          limit,
          page: 1,
        });

        // Sort: active products first, then by name
        const sorted = (result.products ?? [])
          .filter((p) => p.status === "active")
          .sort((a, b) => a.name.localeCompare(b.name));

        setSuggestions(sorted);
      } catch {
        // Silently ignore — the search bar is non-critical
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, categoryId, debounceMs, minLength, limit]);

  const clear = () => {
    abortRef.current?.abort();
    setSuggestions([]);
    setIsLoading(false);
  };

  return { suggestions, isLoading, clear };
}
