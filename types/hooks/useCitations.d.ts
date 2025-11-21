import { Citation, CitationRenderOptions } from '../citations';
/**
 * Hook for working with citations in RAG/Answer Agent responses.
 *
 * Provides utilities for parsing citations in text (e.g., `[resource_id 1, 2]` or `[1, 2]`),
 * replacing them with custom rendering, and extracting cited resource IDs.
 *
 * @returns Object with citation utility functions
 *
 * @example
 * ```typescript
 * const { parseCitations, highlightCitations, extractCitationUrls } = useCitations();
 *
 * // Parse citations from answer text
 * const citations = parseCitations("See docs [resource_id 1, 2]");
 * // Returns: [{ originalText: "[resource_id 1, 2]", ids: ["1", "2"], startIndex: 9, endIndex: 27 }]
 *
 * // Replace with markdown links
 * const rendered = highlightCitations(text, {
 *   renderCitation: (ids) => ids.map(id => `[[${id}]](#hit-${id})`).join(', ')
 * });
 *
 * // Get IDs of cited resources
 * const citedIds = extractCitationUrls(answer);
 * const citedHits = hits.filter(hit => citedIds.includes(hit._id));
 * ```
 */
export declare function useCitations(): {
    parseCitations: (text: string) => Citation[];
    highlightCitations: (text: string, options: CitationRenderOptions) => string;
    extractCitationUrls: (text: string) => string[];
    renderAsMarkdown: (ids: string[]) => string;
    renderAsSequential: (ids: string[], allCitationIds: string[]) => string;
};
//# sourceMappingURL=useCitations.d.ts.map