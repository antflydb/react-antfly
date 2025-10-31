import { ReactNode } from 'react';
import { ModelConfig, QueryHit } from '@antfly/sdk';
export interface RAGResultsProps {
    id: string;
    answerBoxId: string;
    summarizer: ModelConfig;
    systemPrompt?: string;
    table?: string;
    /**
     * Custom render function for the summary text. Allows developers to bring their own
     * markdown renderer (e.g., streamdown.ai, react-markdown, marked) and citation interaction.
     *
     * @param summary - The RAG summary text (may contain inline citations like [doc_id doc1])
     * @param isStreaming - Whether the summary is currently streaming
     * @param hits - Optional search result hits if showHits is enabled
     * @returns Rendered summary component
     *
     * @example With streamdown.ai
     * ```tsx
     * <RAGResults
     *   renderSummary={(summary) => <StreamdownMarkdown>{summary}</StreamdownMarkdown>}
     * />
     * ```
     *
     * @example With custom parser
     * ```tsx
     * <RAGResults
     *   renderSummary={(summary, streaming) => (
     *     <CustomMarkdown text={summary} streaming={streaming} />
     *   )}
     * />
     * ```
     */
    renderSummary?: (summary: string, isStreaming: boolean, hits?: QueryHit[]) => ReactNode;
    /**
     * @deprecated Citations are now inline in the summary text using [doc_id ...] format.
     * Use renderSummary prop to customize how inline citations are displayed.
     */
    showCitations?: boolean;
    /**
     * @deprecated with_citations is no longer supported by the backend.
     * Citations are always included inline in the markdown summary.
     */
    withCitations?: boolean;
    showHits?: boolean;
    fields?: string[];
}
export default function RAGResults({ id, answerBoxId, summarizer, systemPrompt, table, renderSummary, showHits, fields, }: RAGResultsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RAGResults.d.ts.map