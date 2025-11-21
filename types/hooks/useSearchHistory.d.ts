import { QueryHit } from '@antfly/sdk';
/**
 * Citation metadata from RAG/Answer Agent results
 */
export interface CitationMetadata {
    id: string;
    quote?: string;
    score?: number;
}
/**
 * Represents a single search result in history
 */
export interface SearchResult {
    query: string;
    timestamp: number;
    summary: string;
    hits: QueryHit[];
    citations?: CitationMetadata[];
}
/**
 * Structure of search history in localStorage
 */
export interface SearchHistory {
    results: SearchResult[];
}
/**
 * Hook to manage search history with localStorage persistence.
 *
 * Stores search queries, summaries, hits, and citations in browser localStorage
 * with a configurable maximum number of results.
 *
 * @param maxResults - Maximum number of search results to store (default: 10, 0 to disable)
 * @returns Object with history state and management functions
 *
 * @example
 * ```typescript
 * const { history, isReady, saveSearch, clearHistory } = useSearchHistory(10);
 *
 * // Save a search result
 * saveSearch({
 *   query: "how does raft work",
 *   timestamp: Date.now(),
 *   summary: "Raft is a consensus algorithm...",
 *   hits: [...],
 *   citations: [{ id: "doc1", score: 0.95 }]
 * });
 *
 * // Clear all history
 * clearHistory();
 * ```
 */
export declare function useSearchHistory(maxResults?: number): {
    history: SearchResult[];
    isReady: boolean;
    saveSearch: (result: SearchResult) => void;
    clearHistory: () => void;
};
//# sourceMappingURL=useSearchHistory.d.ts.map